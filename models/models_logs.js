const { sql, poolAsync } = require('./db');
const { objectNotEmpty } = require('../helpers/helpers');

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
        await transaction.rollback();
        throw err;
    }
}

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

const insertBloodSugar = async (request, bloodSugar) => {
    if (bloodSugar.value) {
        console.log("Inserting blood sugar");

        request.input("value", sql.Decimal(4, 1), parseFloat(bloodSugar.value));
        const result = await request.query("INSERT INTO BloodSugar (Value) OUTPUT inserted.bloodSugarId VALUES (@value)");

        return result.recordsets[0][0].bloodSugarId;
    }
    console.log("No blood sugar to insert");

    return null;
};

const insertMeal = async (request, meal) => {

    if (objectNotEmpty(meal) && meal.mealName && meal.totalCarbs) {
        let sqlQuery;
        if(meal.recipeId != null) {
            console.log("recipeID! ",meal.recipeId);
            request.input("recipeId", sql.UniqueIdentifier, meal.recipeId);
            sqlQuery = "INSERT INTO Meal (mealName, recipeId, totalCarbs, weight) OUTPUT inserted.mealId VALUES (@mealName, @recipeId, @totalCarbs, @weight)"
        } else{
            sqlQuery = "INSERT INTO Meal (mealName, totalCarbs, weight) OUTPUT inserted.mealId VALUES (@mealName, @totalCarbs, @weight)";
        }
        request.input("mealName", sql.VarChar(100), meal.mealName);
        request.input("totalCarbs", sql.Decimal(7, 3), parseFloat(meal.totalCarbs));

        if (meal.mealWeight) {
            request.input("mealWeight", sql.Decimal(7, 3), parseFloat(meal.mealWeight));
            console.log("Inserting meal with weight");
            const result = await request.query(sqlQuery);
            return result.recordsets[0][0].mealId;
        }
        console.log("Inserting meal without weight");

        const result = await request.query("INSERT INTO Meal (mealName, totalCarbs) OUTPUT inserted.mealId VALUES (@mealName, @totalCarbs)");

        return result.recordsets[0][0].mealId;
    }
    console.log("No meal info to insert");

    return null;
};

const insertInsulin = async (request, insulin) => {
    if (insulin.insulinType && insulin.units) {
        console.log("Inserting insulin");

        request.input("units", sql.Decimal(7, 4), parseFloat(insulin.units));
        request.input("type", sql.VarChar(100), insulin.insulinType);

        const result = await request.query("INSERT INTO InsulinTaken (units, type) OUTPUT inserted.insulinTakenId VALUES (@units, @type)");

        return result.recordsets[0][0].insulinTakenId;
    }
    console.log("No insulin to insert");

    return null;
};

const insertLog = async (request, logDetails) => {
    console.log("Inserting log");

    const logTime = combineDateTime(logDetails.date, logDetails.time);

    request.input("userId", sql.UniqueIdentifier, logDetails.userId);
    request.input("bloodSugarId", sql.UniqueIdentifier, logDetails.bloodSugarId);
    request.input("mealId", sql.UniqueIdentifier, logDetails.mealId);
    request.input("insulinTakenId", sql.UniqueIdentifier, logDetails.insulinTakenId);
    request.input("logTime", sql.SmallDateTime, logTime);

    const result = await request.query("INSERT INTO Log (userId, bloodSugarId, mealId, insulinTakenId, logTime) OUTPUT inserted.insulinTakenId VALUES (@userId, @bloodSugarId, @mealId, @insulinTakenId, @logTime)");

    return result.recordsets[0][0].logId;
};

function combineDateTime(date, time) {
    return date + " " + time;
}

module.exports = { handleInsertLog, handleSelectLogs };