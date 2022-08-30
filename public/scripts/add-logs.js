/**
 * This file handles all front-end scripting for add-logs.ejs.
 */

window.addEventListener('load', async (event) => {
    fillDateTime();
    await getRecipeInfoFromServer();
    setUpRecipeToggle();
    handleSelectChanges();
    handleServingsChanges();
});

window.addEventListener('beforeunload', () => {
    setLocals();
})

/**
 * Pre-fills the date and time inputs to the current time.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleTimeString
 * https://www.w3docs.com/snippets/javascript/how-to-get-the-current-date-and-time-in-javascript.html
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement
 */
 function fillDateTime() {
    let timeInput = document.getElementById('time-input');
    let dateInput = document.getElementById('date-input');

    let currentDate = new Date();
    let currentTime = currentDate.toLocaleTimeString('en-IT', { hour: '2-digit', minute: '2-digit', hour12: false });

    dateInput.valueAsDate = currentDate;
    timeInput.value = currentTime;
}

/**
 * Pulls all recipe names, recipeIds and carbsPerServing for a given user.
 * Populates the dropdown menu in 'meal'.
 */
 async function getRecipeInfoFromServer() {
    makeGetRequest(url = '/recipes?filters=recipeName,recipeId,carbsPerServing', params = '')
        .then((data) => {
            fillSelect(data);
            return true;
        }).catch(err => { console.log(err); });
}

/**
 * When page is loaded, ensure recipe toggle is set to 'off'
 */
 function setUpRecipeToggle() {
    mealSwitch = document.getElementById('meal-recipe-switch');
    mealSwitch.addEventListener("change", handleSwitchToggle);
    mealSwitch.checked = false;
}

/**
 * When the number of servings of a recipe changes, 
 * updates the total carbs in the log.
 */
function handleServingsChanges() {
    document.getElementById('servings-input').addEventListener('change', (event) => {
        const carbsPerServing = document.getElementById('carbs-per-serving-input').value;
        const numberOfServings = event.target.value;

        const totalCarbs = parseFloat(carbsPerServing) * parseFloat(numberOfServings);
        let totalCarbsInput = document.getElementById('carbs-input');
        totalCarbsInput.value = totalCarbs;
    });
}

/**
 * When a different recipe is selected, fill out the meal name, 
 * total carbs, carbsPerServing to match
 */
function handleSelectChanges() {
    document.getElementById('recipe-name-select').addEventListener('change', (event) => {
        const selectedIndex = event.target.selectedIndex;
        const selectValue = event.target.value;
        const recipeName = event.target[selectedIndex].innerHTML;

        let totalCarbsInput = document.getElementById('carbs-input');
        let carbsPerServingInput = document.getElementById('carbs-per-serving-input');
        let mealNameInput = document.getElementById('meal-name-input');
        let numberOfServingsInput = document.getElementById('servings-input');

        if (selectedIndex != 0) { // If the default select is not selected
            const [_, carbsPerServing] = selectValue.split(';');
            carbsPerServingInput.value = carbsPerServing;
            mealNameInput.value = recipeName;
            totalCarbsInput.value = carbsPerServing * numberOfServingsInput.value; // * number of servings

        } else {
            carbsPerServingInput.value = 0;
            mealNameInput.value = "";
            totalCarbsInput.value = 0;
            numberOfServingsInput.value = 1;
        }
    });
}

/**
 * Populates the select with the user's recipes.
 * @param {array} recipes array of user's recipes from server
 */
function fillSelect(recipes) {
    let recipeSelect = document.getElementById('recipe-name-select');
    recipes.map(recipe => {
        const optionHtml = `<option value="${recipe.recipeId};${recipe.carbsPerServing}" id="${recipe.recipeId};${recipe.carbsPerServing}" >${recipe.recipeName}</option>`;
        recipeSelect.innerHTML += optionHtml;
        recipeSelect.innerHtml += optionHtml;
    });
}

/**
 * Makes get request to server
 * @param {string} url url to request
 * @returns the response in JSON format
 */
// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function makeGetRequest(url) {
    // ref: https://www.npmjs.com/package/csurf
    // See 'Using Ajax' Section
    const token = document.getElementById('csrf-token').content;

    return await fetch(url, {
        credentials: 'same-origin',
        headers: {
            'CSRF-Token': token
        },
        method: 'GET',
        mode: 'same-origin'
    }).then(response => {
        if (response.status != 200) {
            throw new Error(`There was an error connecting to the server (Response: ${response.status})`);
        }
        return response.json();
    });
}

/**
 * Validates that at least one of blood sugar, meal or insulin is filled out
 * @returns true if form validates, false if it doesn't
 */
function validateForm() {
    resetDisplayError();
    try {
        if (noBoxesAreFilled()) {
            console.log("no forms filled");
            handleDisplayError("Fill out one or more of: Blood Sugar, Meal, Insulin sections");
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}

/**
 * Clears errors
 */
function resetDisplayError() {
    let alert = document.getElementById('alert');
    if (alert) {
        alert.remove();
    }
}

/**
 * Displays error
 * @param {string} errorString error to display
 */
function handleDisplayError(errorString) {
    let siblingElement = document.getElementById('form-part-2');
    let errorDivHtml = `<div class="alert alert-warning" role="alert" id="alert">
                            ${errorString}
                        </div>`
    siblingElement.insertAdjacentHTML("afterend", errorDivHtml);

}

/**
 * Checks if at least one input is filled
 * @returns true if no boxes are filled, false if at least one box is filled
 */
function noBoxesAreFilled() {
    return mealIsEmpty() && insulinIsEmpty() && bloodSugarIsEmpty();
}

/**
 * Checks if meal is filled in
 * @returns boolean
 */
function mealIsEmpty() {
    let mealNameInput = document.getElementById('meal-name-input');
    let carbsInput = document.getElementById('carbs-input');

    return isNullOrWhitespace(mealNameInput.value) && isNullOrWhitespace(carbsInput.value);
}

/**
 * Checks if insulin is filled in
 * @returns boolean
 */
function insulinIsEmpty() {
    let insulinUnitsInput = document.getElementById('insulin-units-input');
    return isNullOrWhitespace(insulinUnitsInput.value);
}

/**
 * Checks if blood sugar is filled in
 * @returns boolean
 */
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

/**
 * Handles what happens if recipe toggle is changed.
 * @param {event} event 
 */
function handleSwitchToggle(event) {
    if (this.checked) {
        showRecipeInputs();
    } else {
        showManualMealInputs();
    }
}

/**
 * Shows recipe inputs for meal; pulls values from locals.
 * Ensures that if a user selects a recipe, then un-toggles the recipe
 * switch, then re-toggles, the recipe info is not lost.
 */
function showRecipeInputs() {
    document.getElementById('input-recipe-name').removeAttribute('hidden', true);
    document.getElementById('input-recipe-servings').removeAttribute('hidden', true);
    document.getElementById('carbs-input').readOnly = true;

    getLocals();
}

/**
 * Hides recipe inputs for meal; saves values in locals
 */
function showManualMealInputs() {
    document.getElementById('input-recipe-name').setAttribute('hidden', true);
    document.getElementById('input-recipe-servings').setAttribute('hidden', true);
    document.getElementById('carbs-input').readOnly = false;
    
    setLocals();
}

/**
 * Pulls info for recipe information from locals
 */
function getLocals() {
    const selectedValueInput = document.getElementById('recipe-name-select');
    const carbsPerServingInput = document.getElementById('carbs-per-serving-input');
    const numberOfServingsInput = document.getElementById('servings-input');

    const selectedValue = localStorage.getItem("selectedValue");
    const carbsPerServing = localStorage.getItem("carbsPerServing");
    const numberOfServings = localStorage.getItem("numberOfServings");

    selectedValueInput.value = selectedValue;
    carbsPerServingInput.value = carbsPerServing;
    numberOfServingsInput.value = numberOfServings;
}

/**
 * Saves information from recipe input in locals
 */
function setLocals() {
    const selectedValueInput = document.getElementById('recipe-name-select');
    const carbsPerServingInput = document.getElementById('carbs-per-serving-input');
    const numberOfServingsInput = document.getElementById('servings-input');

    const selectedValue = selectedValueInput.value;
    const carbsPerServing = carbsPerServingInput.value;
    const numberOfServings = numberOfServingsInput.value;

    localStorage.setItem("selectedValue", selectedValue);
    localStorage.setItem("carbsPerServing", carbsPerServing);
    localStorage.setItem("numberOfServings", numberOfServings);
}
