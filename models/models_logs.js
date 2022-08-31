/**
 * This file handles all db interaction regarding logs
 */

const { sql, poolAsync } = require('./db');
const { objectNotEmpty } = require('../helpers/helpers');

/**
 * Using transactions, handles inserting blood sugars,
 * meal info, insulin and new log.
 * First inserts blood sugars, meal and insulin, 
 * then takes the returned Ids from those functions 
 * and inserts a new log.
 * @param {object} newLog object containing all information needed to insert new log
 */
async function handleInsertLog(newLog) {
    // How to use transactions:
    // From mssql docs https://tediousjs.github.io/node-mssql/#transaction
    // Use with await/async: https://stackoverflow.com/a/68832025
    const pool = await poolAsync;

    let transaction;
    try {
        transaction = new sql.Transaction(pool);

        // Troubleshooting transaction
        // Docs were confusing, initially didn't realise that logic
        // went in a callback function
        // https://github.com/tediousjs/node-mssql/issues/123#issuecomment-73353413
        // This explained where I'd been going wrong
        await transaction.begin(async function (err) {
            const request = new sql.Request(transaction);

            const bloodSugarId = await insertBloodSugar(request, newLog.bloodSugar);
            const mealId = await insertMeal(request, newLog.meal);
            const insulinTakenId = await insertInsulin(request, newLog.insulinList);
            const logId = await insertLog(request, {
                bloodSugarId,
                mealId,
                insulinTakenId,
                date: newLog.date,
                time: newLog.time,
                userId: newLog.userId
            })

            await transaction.commit();

            return [bloodSugarId, mealId, insulinTakenId, logId];
        });

    } catch (err) {
        // Rollback transaction if anything goes wrong.
        await transaction.rollback();
        throw err;
    }
}

/**
 * Selects all logs for a given user. Includes blood sugar, 
 * meal and blood sugar information,
 * @param {guid} userId the userId that owns the logs
 * @returns Matching logs
 */
async function handleSelectLogs(userId) {
    const pool = await poolAsync;
    const queryString = 'SELECT * FROM Log l ' +
        'LEFT JOIN BloodSugar b ON (l.bloodSugarId = b.bloodSugarId) ' +
        'LEFT JOIN InsulinTaken i ON (l.insulinTakenId = i.insulinTakenId) ' +
        'LEFT JOIN Meal m ON (l.mealId = m.mealId) ' +
        'WHERE userId = @userId ' +
        'ORDER BY l.logTime DESC';

    let result = await pool.request()
        .input('userId', sql.UniqueIdentifier, userId)
        .query(queryString);
    return result.recordsets[0];
}

/**
 * Inserts a blood sugar in a given transaction. 
 * Returns the inserted bloodSugarId
 * @param {mssql Request} request the request being used in the transaction
 * @param {float} bloodSugar the blood sugar to insert
 * @returns bloodSugarId
 */
const insertBloodSugar = async (request, bloodSugar) => {
    if (bloodSugar.value) {
        console.log("Inserting blood sugar");

        // Set up prepared statement
        request.input("value", sql.Decimal(4, 1), parseFloat(bloodSugar.value));
        const result = await request.query("INSERT INTO BloodSugar (Value) OUTPUT inserted.bloodSugarId VALUES (@value)");

        return result.recordsets[0][0].bloodSugarId;
    }
    console.log("No blood sugar to insert");

    return null;
};

/**
 * Inserts a meal in a given transaction and returns
 *  the inserted mealId.
 * @param {mssql request} request the request being used in the transaction
 * @param {object} meal the meal information to insert
 * @returns inserted mealId or null if unsuccessful
 */
const insertMeal = async (request, meal) => {

    // Ensure that a meal actually exists to insert
    if (objectNotEmpty(meal) && meal.mealName && meal.totalCarbs) {
        let sqlQuery;

        // If a meal contains a recipe
        if (meal.recipeId != null) {
            // Set up prepared statement
            request.input("recipeId", sql.UniqueIdentifier, meal.recipeId);
            request.input("recipeServings", sql.TinyInt, meal.recipeServings);
            sqlQuery = "INSERT INTO Meal (mealName, recipeId, totalCarbs, recipeServings) OUTPUT inserted.mealId VALUES (@mealName, @recipeId, @totalCarbs, @recipeServings)"

        } else { // The meal contains no recipe
            sqlQuery = "INSERT INTO Meal (mealName, totalCarbs) OUTPUT inserted.mealId VALUES (@mealName, @totalCarbs)";
        }

        request.input("mealName", sql.VarChar(100), meal.mealName);
        request.input("totalCarbs", sql.Decimal(7, 3), parseFloat(meal.totalCarbs));

        const result = await request.query(sqlQuery);

        return result.recordsets[0][0].mealId;
    }
    console.log("No meal info to insert");

    return null;
};

/**
 * Inserts insulin in a given transaction and returns
 *  the inserted insulin.
 * @param {mssql request} request the request being used in the transaction
 * @param {object} insulin the insulin information to insert
 * @returns inserted insulinId or null if unsuccessful
 */
const insertInsulin = async (request, insulin) => {
    // Check that there is insulin to be inserted.
    if (insulin.insulinType && insulin.units) {
        console.log("Inserting insulin");

        // Set up prepared statements
        request.input("units", sql.Decimal(7, 4), parseFloat(insulin.units));
        request.input("type", sql.VarChar(100), insulin.insulinType);

        const result = await request.query("INSERT INTO InsulinTaken (units, type) OUTPUT inserted.insulinTakenId VALUES (@units, @type)");

        return result.recordsets[0][0].insulinTakenId;
    }
    console.log("No insulin to insert");

    return null;
};

/**
 * Once a blood sugar, meal and insulin have been inserted,
 * inserts the log in a given transaction and returns
 * the inserted logId.
 * @param {mssql request} request the request being used in the transaction
 * @param {object} logDetails the logDetails to insert
 * @returns inserted logId or null if unsuccessful
 */
const insertLog = async (request, logDetails) => {
    console.log("Inserting log");

    const logTime = combineDateTime(logDetails.date, logDetails.time);

    // Set up prepared statement
    request.input("userId", sql.UniqueIdentifier, logDetails.userId);
    request.input("bloodSugarId", sql.UniqueIdentifier, logDetails.bloodSugarId);
    request.input("mealId", sql.UniqueIdentifier, logDetails.mealId);
    request.input("insulinTakenId", sql.UniqueIdentifier, logDetails.insulinTakenId);
    request.input("logTime", sql.SmallDateTime, logTime);

    const result = await request.query("INSERT INTO Log (userId, bloodSugarId, mealId, insulinTakenId, logTime) OUTPUT inserted.insulinTakenId VALUES (@userId, @bloodSugarId, @mealId, @insulinTakenId, @logTime)");

    return result.recordsets[0][0].logId;
};

/**
 * Combines a date and time string.
 * In retrospect, it would have been better to use UTC datetime strings
 * And set that up at client level.
 * @param {string} date date string
 * @param {string} time time string
 * @returns combined date and time string
 */
function combineDateTime(date, time) {
    return date + " " + time;
}

module.exports = { handleInsertLog, handleSelectLogs };