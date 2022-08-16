const { handleInsertLog, handleSelectLogs } = require('../models/models_logs.js')

function addLog(logInput) {

    let newLog = {
        userId: logInput.userId,
        time: logInput.timeInput,
        date: logInput.dateInput,
        meal: {
            mealName: logInput.mealNameInput,
            mealWeight: logInput.mealWeightInput,
            totalCarbs: logInput.carbsInput
        },
        bloodSugar: logInput.bloodSugarInput,
        insulinList: {
            insulinType: logInput.insulinTypeInput,
            units: logInput.insulinUnitsInput
        } //todo change to array to allow for multiple shots to be taken at once
    }

    handleInsertLog(newLog);
}

async function getLogs(userId) {
    let logs = await handleSelectLogs(userId);
    return {
        logTime: logs.logTime,
        bloodSugar: logs.Value,
        insulinUnits: logs.units,
        insulinType: logs.type,
        totalCarbs: logs.totalCarbs,
        mealName: logs.mealName,
        mealWeight: logs.mealWeight
    };
}

module.exports = { addLog, getLogs };