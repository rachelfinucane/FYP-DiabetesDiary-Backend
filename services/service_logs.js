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
        bloodSugar: { value: logInput.bloodSugarInput },
        insulinList: {
            insulinType: logInput.insulinTypeInput,
            units: logInput.insulinUnitsInput
        } //todo change to array to allow for multiple shots to be taken at once
    }

    handleInsertLog(newLog);
}

async function getLogs(userId) {
    let logs = await handleSelectLogs(userId);
    return logs.map(log => {
        return {
            logTime: log.logTime,
            meal: {
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