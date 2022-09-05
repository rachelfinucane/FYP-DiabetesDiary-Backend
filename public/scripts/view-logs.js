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
                        <h3 class="card-title">${timeString}</h3>
                        <div class="my-3" id="inner-card-div-${index}"></div>
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
        // return `<div class="input-group mb-3">
        //             <input class="form-control" type="text" value="${bloodSugar.value}"
        //                 aria-label="Blood Sugar" aria-describedby="blood-sugar-units-${index}" disabled readonly>
        //                 <span class="input-group-text" id="blood-sugar-units-${index}">mmol/mol</span>
        //         </div>`

        // Source of icon: https://icons.getbootstrap.com/icons/droplet-fill/
        return `<p class="mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-droplet-fill" viewBox="0 0 16 16">
                        <path d="M8 16a6 6 0 0 0 6-6c0-1.655-1.122-2.904-2.432-4.362C10.254 4.176 8.75 2.503 8 0c0 0-6 5.686-6 10a6 6 0 0 0 6 6ZM6.646 4.646l.708.708c-.29.29-1.128 1.311-1.907 2.87l-.894-.448c.82-1.641 1.717-2.753 2.093-3.13Z"/>
                    </svg>
                    Blood Sugar: ${bloodSugar.value} mmol/mol
                </p>`;
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
        // return `<div class="mb-3">
        //             <div class="input-group mb-3">
        //                 <span class="input-group-text" id="meal-name-input-${index}">${meal.mealName}</span>
        //                 <input class="form-control" type="text" value="${meal.totalCarbs}"
        //                     aria-label="Disabled input example" disabled readonly>
        //                 <span class="input-group-text" id="basic-addon2">grams Carbs</span>
        //             </div>
        //         </div>`

        // Icon source: https://icons.getbootstrap.com/icons/egg-fried/
        return `<p class="mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-egg-fried" viewBox="0 0 16 16">
                        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                        <path d="M13.997 5.17a5 5 0 0 0-8.101-4.09A5 5 0 0 0 1.28 9.342a5 5 0 0 0 8.336 5.109 3.5 3.5 0 0 0 5.201-4.065 3.001 3.001 0 0 0-.822-5.216zm-1-.034a1 1 0 0 0 .668.977 2.001 2.001 0 0 1 .547 3.478 1 1 0 0 0-.341 1.113 2.5 2.5 0 0 1-3.715 2.905 1 1 0 0 0-1.262.152 4 4 0 0 1-6.67-4.087 1 1 0 0 0-.2-1 4 4 0 0 1 3.693-6.61 1 1 0 0 0 .8-.2 4 4 0 0 1 6.48 3.273z"/>
                    </svg>
                    ${meal.mealName} &#9679 ${meal.totalCarbs}g Carbs
                </p>`
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
        // return `<div class="input-group mb-3">
        //             <input class="form-control" type="text" value="${insulinList.units}"
        //                 aria-label="Insulin Type" id="insulin-type-${index}" disabled readonly>
        //             <span class="input-group-text" id="insulin-units">Units ${insulinList.insulinType}</span>
        //         </div>`

        // Icon source: https://icons.getbootstrap.com/icons/prescription2/
        return `<p class="mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-prescription2" viewBox="0 0 16 16">
                        <path d="M7 6h2v2h2v2H9v2H7v-2H5V8h2V6Z"/>
                        <path fill-rule="evenodd" d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v10.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 14.5V4a1 1 0 0 1-1-1V1Zm2 3h8v10.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5V4ZM3 3V1h10v2H3Z"/>
                    </svg>
                    ${insulinList.units} Units ${insulinList.insulinType}
                </p>`
    }
    return "";
}

// https://stackabuse.com/javascript-check-if-an-object-is-empty/
const objectNotEmpty = (obj) => {
    return Object.values(obj).length > 0 && obj.constructor === Object;
}