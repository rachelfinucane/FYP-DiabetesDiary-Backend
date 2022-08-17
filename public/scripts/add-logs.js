window.addEventListener('load', (event) => {
    fillDateTime();
});

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleTimeString
//https://www.w3docs.com/snippets/javascript/how-to-get-the-current-date-and-time-in-javascript.html
//https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement


/**
 * Pre-fills the date and time inputs to the current time.
 */
function fillDateTime() {
    let timeInput = document.getElementById('time-input');
    let dateInput = document.getElementById('date-input');

    let currentDate = new Date();
    let currentTime = currentDate.toLocaleTimeString('en-IT', { hour: '2-digit', minute: '2-digit', hour12: false });

    dateInput.valueAsDate = currentDate;
    timeInput.value = currentTime;
}

function validateForm() {
    resetFormError();
    try {
        if (noBoxesAreFilled()) {
            console.log("no forms filled");
            handleFormError("Fill out one or more of: Blood Sugar, Meal, Insulin sections");
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}

function resetFormError() {
    let alert = document.getElementById('alert');
    if (alert) {
        alert.remove();
    }
    // let form = document.getElementById('log-form');
    // form.classList.remove('was-validated');
    // setValid();
}

function handleFormError(errorString) {
    let siblingElement = document.getElementById('form-part-2');
    let errorDivHtml = `<div class="alert alert-warning" role="alert" id="alert">
                            ${errorString}
                        </div>`
    siblingElement.insertAdjacentHTML("afterend", errorDivHtml);

    // setInvalid();
}

// function setInvalid() {
//     let inputs = document.querySelectorAll('.log-inputs');
//     inputs.forEach((input) => {
//         input.classList.add('is-invalid');
//     })
// }

// function setValid() {
//     let inputs = document.querySelectorAll('.log-inputs');
//     inputs.forEach((input) => {
//         input.classList.remove('is-invalid');
//     })
// }

function noBoxesAreFilled() {
    return mealIsEmpty() || insulinIsEmpty() || bloodSugarIsEmpty();
}

function mealIsEmpty() {
    let mealNameInput = document.getElementById('meal-name-input');
    let carbsInput = document.getElementById('carbs-input');

    return isNullOrWhitespace(mealNameInput.value) && isNullOrWhitespace(carbsInput.value);
}

function insulinIsEmpty() {
    let insulinUnitsInput = document.getElementById('insulin-units-input');
    return isNullOrWhitespace(insulinUnitsInput.value);
}

function bloodSugarIsEmpty() {
    let bloodSugarInput = document.getElementById('blood-sugar-input');
    return isNullOrWhitespace(bloodSugarInput.value);
}

// Ref: wanted a replacement for IsNullOrWhiteSpace from C#
// This had a replacement function: https://stackoverflow.com/a/5559461
function isNullOrWhitespace(input) {

    if (typeof input === 'undefined' || input == null) return true;

    return input.replace(/\s/g, '').length < 1;
}