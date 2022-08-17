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
    return await handleSelectLogs(userId);
}

module.exports = { addLog, getLogs };