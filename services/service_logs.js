/**
 * This file handles all business logic for Logs.
 */

const { handleInsertLog, handleSelectLogs } = require('../models/models_logs.js')

/**
 * Takes form input and formats it for the model_logs to use.
 * Adds a recipe to the new object if one exists.
 * @param {object} logInput contains info for new log from form
 */
function addLog(logInput) {

    // Create our newLog object
    let newLog = {
        userId: logInput.userId,
        time: logInput.timeInput,
        date: logInput.dateInput,
        meal: {
            mealName: logInput.mealNameInput,
            mealWeight: logInput.mealWeightInput,
            totalCarbs: logInput.carbsInput
        },
        bloodSugar: { value: logInput.bloodSugarInput },
        insulinList: {
            insulinType: logInput.insulinTypeInput,
            units: logInput.insulinUnitsInput
        } //todo change to array to allow for multiple shots to be taken at once
    }

    // Add recipe info if it exists
    if (logInput['recipeSelect'] != null) {
        let [recipeId, _] = logInput.recipeSelect.split(';');
        if (recipeId !== "default") {
            newLog.meal.recipeId = recipeId;
            newLog.meal.recipeServings = logInput.servingsInput
        }
    }

    handleInsertLog(newLog);
}

/**
 * 
 * @param userId 
 * @returns array of logs
 * 
 * Gets the logs relating to the specified user.
 * Formats and returns the data in a usable way.
 * Each log object contains the time, 
 * and a child object each for meal, bloodSugar,
 * and insulinList.
 * 
 * The child object will be empty if 
 * there is no data for that object.
 */
async function getLogs(userId) {
    let logs = await handleSelectLogs(userId);
    return logs.map(log => {
        return {
            logTime: log.logTime,
            meal: {
                // ... (condition && { key:value })
                // inserts object only if not null
                // meal will be an empty object if all three values are null
                // https://stackoverflow.com/a/67862983
                ...(log.mealName && { mealName: log.mealName }),
                ...(log.mealWeight && { mealWeight: log.mealWeight }),
                ...(log.totalCarbs && { totalCarbs: log.totalCarbs })
            },
            bloodSugar: {
                ...(log.Value && { value: log.Value })
            },
            insulinList: {
                ...(log.type && { insulinType: log.type }),
                ...(log.units && { units: log.units })
            }
        }
    });
}

module.exports = { addLog, getLogs };