// Some of the 'album' page layout is taken from 
// the Bootstrap Docs Examples
// https://getbootstrap.com/docs/5.2/examples/album/

window.addEventListener('load', (event) => {
    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    fetchLogs('/logs')
        .then((data) => {
            data.forEach(displayData);
        });
});

/**
 * Makes Get request to server
 * @param {string} url url
 * @returns response in JSON format
 */
// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function fetchLogs(url) {
    // ref: https://www.npmjs.com/package/csurf
    // See 'Using Ajax' Section
    const token = document.getElementById('csrf-token').content;

    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            'CSRF-Token': token
        },
        method: 'GET',
        mode: 'same-origin'
    });
    return response.json();
}

/**
 * Displays a single log.
 * @param {object} singleLog a single log to display
 * @param {int} index the index of the log
 */
function displayData(singleLog, index) {
    let cardGroupContainer = document.getElementById('card-groups-container');
    cardGroupContainer.innerHTML += addOuterCard(singleLog.logTime, index);

    let cardBody = document.getElementById(`inner-card-div-${index}`);
    cardBody.innerHTML += addBloodSugar(singleLog.bloodSugar, index);
    cardBody.innerHTML += addMeal(singleLog.meal, index);
    cardBody.innerHTML += addInsulin(singleLog.insulinList, index);
}

/**
 * Constructs the outer card HTML
 * @param {string} logTime Log time
 * @param {int} index log index in array
 * @returns HTML for outer card
 */
function addOuterCard(logTime, index) {
    let time = new Date(Date.parse(logTime));
    let timeString = time.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    return `<div class="col mx-auto">
                <div class="card shadow-sm" id="card-${index}">
                    <div class="card-body" id="card-body-${index}">
                        <h5 class="card-title">${timeString}</h5>
                        <div class="mb-3" id="inner-card-div-${index}"></div>
                    </div>
                </div>
            </div>`;

}

/**
 * Constructs blood sugar html if exists in the log
 * @param {object} bloodSugar blood sugar info
 * @param {int} index index of the log in the array
 * @returns blood sugar HTML
 */
function addBloodSugar(bloodSugar, index) {
    if (objectNotEmpty(bloodSugar)) {
        return `<div class="input-group mb-3">
                    <input class="form-control" type="text" value="${bloodSugar.value}"
                        aria-label="Blood Sugar" aria-describedby="blood-sugar-units-${index}" disabled readonly>
                        <span class="input-group-text" id="blood-sugar-units-${index}">mmol/mol</span>
                </div>`
    }
    return "";
}

/**
 * Constructs meal html if exists in the log
 * @param {object} meal meal info
 * @param {int} index index of the log in the array
 * @returns meal HTML
 */
function addMeal(meal, index) {
    if (objectNotEmpty(meal)) {
        return `<div class="mb-3">
                    <div class="input-group mb-3">
                        <span class="input-group-text" id="meal-name-input-${index}">${meal.mealName}</span>
                        <input class="form-control" type="text" value="${meal.totalCarbs}"
                            aria-label="Disabled input example" disabled readonly>
                        <span class="input-group-text" id="basic-addon2">grams Carbs</span>
                    </div>
                </div>`
    }
    return "";
}

/**
 * Constructs insulin html if exists in the log
 * @param {object} insulinList insulin info
 * @param {int} index index of the log in the array
 * @returns insulin HTML
 */
function addInsulin(insulinList, index) {
    if (objectNotEmpty(insulinList)) {
        return `<div class="input-group mb-3">
                    <input class="form-control" type="text" value="${insulinList.units}"
                        aria-label="Insulin Type" id="insulin-type-${index}" disabled readonly>
                    <span class="input-group-text" id="insulin-units">Units ${insulinList.insulinType}</span>
                </div>`
    }
    return "";
}

// https://stackabuse.com/javascript-check-if-an-object-is-empty/
const objectNotEmpty = (obj) => {
    return Object.values(obj).length > 0 && obj.constructor === Object;
}