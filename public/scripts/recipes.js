/**
 * This file handles all front-end scripting for add-logs.ejs.
 */

let searchResults;

window.addEventListener('load', () => {
    getSavedRecipesFromServer();
});

/**
 * Pulls a user's recipes from server and displays them.
 */
function getSavedRecipesFromServer() {
    makeGetRequest(url = '/recipes/userId', params = '')
        .then((data) => {
            localStorage.setItem('recipes', JSON.stringify(data));
            showSavedRecipes();
        }).catch(err => { console.log(err); });
}

/**
 * Makes Get request to server
 * @param {string} url url
 * @returns response in JSON format
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
    })
        .catch(err => {
            handleDisplayError("There was an error connecting to the server.");
        })
        .then(async response => {
            if (response.status > 200 && response.status < 500) {
                let message = await response.json();
                handleDisplayError(message.message);
                throw new Error(response.status, message.message);
            } else if (response.status >= 500) {
                let message = await response.json();
                handleDisplayError(`There was an error connecting to the server (Response: ${response.status}, ${message?.message})`);
                throw new Error(response.status, message?.message);
            }
            return response.json();
        });
}

/**
 * POSTS to server
 * @param {string} url 
 * @param {object} body object to send 
 */
// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function makePostRequest(url, body) {
    // ref: https://www.npmjs.com/package/csurf
    // See 'Using Ajax' Section
    const token = document.getElementById('csrf-token').value;

    result = await fetch(url, {
        method: 'POST',
        mode: 'same-origin',
        headers: {
            'CSRF-Token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
        .catch(err => {
            handleDisplayError("There was an error connecting to the server.");
        })
        .then(async response => {
            if (response.status > 200 && response.status < 500) {
                let message = await response.json();
                handleDisplayError(message.message);
                throw new Error(response.status, message.message);
            } else if (response.status >= 500) {
                let message = await response.json();
                handleDisplayError(`There was an error connecting to the server (Response: ${response.status}, ${message?.message})`);
                throw new Error(response.status, message?.message);
            }
        });

}

/**
 * Shows the recipe search box.
 * @param {event} event 
 */
function showSearchBox(event) {
    event.preventDefault();
    displayShowBackButton();

    const searchBoxHtml =
        `<form onsubmit='searchRecipes(event);' class="row text-center g-3">
            <div class="col-md-6">
                <label class="visually-hidden" for="input-recipe-keyword">Recipe keywords</label>
                <input type="search" class="form-control" id="input-recipe-keyword"
                    name="q" placeholder="Search for a recipe" required>
            </div>

            <div class="col-md-4">
                <label class="visually-hidden" for="select-recipe-source">Preference</label>
                <select class="form-select" id="select-recipe-source" required>
                    <option selected disabled value="">Select a website</option>
                    <option value="1">All</option>
                    <option value="2">BBC Good Food</option>
                    <option value="3">MyRecipes</option>
                </select>
            </div>

            <div class="col d-grid gap-2 d-md-block">
                <button class="btn btn-dark w-100">Search</button>
            </div>
            
        </form>`;
    let searchBoxContainer = document.getElementById('search-box-container');
    let recipeDisplayContainer = document.getElementById('recipe-display-container');
    searchBoxContainer.innerHTML = searchBoxHtml;
    recipeDisplayContainer.innerHTML = "";
}

/**
 * Displays the saved recipes.
 */
function showSavedRecipes() {
    resetDisplayError();

    let searchResultsContainer = document.getElementById('search-results-container');
    let searchBox = document.getElementById('search-box-container');

    searchResultsContainer.innerHTML = "";
    searchBox.innerHTML = "";

    displaySearchBoxButton();

    // Then show all recipes
    const recipeDisplayContainer = document.getElementById('recipe-display-container');
    recipeDisplayContainer.innerHTML = "";

    const recipes = JSON.parse(localStorage.getItem('recipes'));
    recipes.map(recipe => {
        
        let ingredientsHtml = "";
        if (recipe.recipeType == 'included with recipe') {
            recipe.ingredients.forEach(ingredient => {
                ingredientsHtml += `<p class="card-text">${ingredient.ingredientName}</p>`;
            });
        } else {
            recipe.ingredients.forEach(ingredient => {
                ingredientsHtml += `<p class="card-text">${ingredient.ingredientAmount} ${ingredient.ingredientUnit} ${ingredient.ingredientName}</p>`;
            });
        }

        let recipeCardHtml = `<div class="card col-md-8 mb-3 mx-auto" id="card">
                                    
                                            <div class="card-body">
                                                <h3 class="card-title">${recipe.recipeName}</a></h3>
                                                <!-- Decided not to display images for copyright reasons -->
                                                <!-- <div class="col-md-4">
                                                    <img src="${recipe.recipeImageUrl}" class="rounded-start h-100 w-100 googleThumbnail" alt="Recipe Image">
                                                </div> -->
                                                <p class="card-text">Serves: ${recipe.recipeYields} &#9679 Carbs Per Serving: ${recipe.carbsPerServing}g</p>

                                                <div class="col mx-auto pt-4" id="recipe-display-container">
                                                <div class="accordion accordion-flush" id="recipe-collapse-${recipe.recipeId}">
                                                    <div class="accordion-item">
                                                      <h2 class="accordion-header" id="ingredients-heading-${recipe.recipeId}">
                                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapse-ingredients-${recipe.recipeId}" aria-expanded="false" aria-controls="flush-collapse-ingredients-${recipe.recipeId}">
                                                          Ingredients
                                                        </button>
                                                      </h2>
                                                      <div id="flush-collapse-ingredients-${recipe.recipeId}" class="accordion-collapse collapse" aria-labelledby="ingredients-heading-${recipe.recipeId}" >
                                                        <div class="accordion-body">
                                                        <p class="card-text">${ingredientsHtml}</p>                                   
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div class="accordion-item">
                                                      <h2 class="accordion-header" id="accordian-header-${recipe.recipeId}">
                                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapse-instructions-${recipe.recipeId}" aria-expanded="false" aria-controls="flush-collapse-instructions-${recipe.recipeId}">
                                                          Instructions
                                                        </button>
                                                      </h2>
                                                      <div id="flush-collapse-instructions-${recipe.recipeId}" class="accordion-collapse collapse" aria-labelledby="accordian-header-${recipe.recipeId}" >
                                                        <div class="accordion-body">
                                                            ${recipe.recipeInstructions}                                 
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                
                                            </div>
                                            </div>
                                        
                                </div>`

        recipeDisplayContainer.innerHTML += recipeCardHtml;

    });
}

/**
 * Shows button "Add a new Recipe"
 */
function displaySearchBoxButton() {
    let showSearchBoxButton = document.getElementById('a-new-recipe');
    let showRecipeListButton = document.getElementById('a-view-recipes');
    showSearchBoxButton.removeAttribute('hidden', true);
    showRecipeListButton.setAttribute('hidden', true);
}

/**
 * Shows button "Back to saved recipes"
 */
function displayShowBackButton() {
    let showSearchBoxButton = document.getElementById('a-new-recipe');
    let showRecipeListButton = document.getElementById('a-view-recipes');
    showSearchBoxButton.setAttribute('hidden', true);
    showRecipeListButton.removeAttribute('hidden', true);
}

/**
 * Calls server to use google search api
 * to search for recipes using user-entered keywords.
 * @param {event} event 
 */
function searchRecipes(event) {
    event.preventDefault();
    resetDisplayError();
    const siteSelect = document.getElementById('select-recipe-source');
    let recipeSite = siteSelect.options[siteSelect.selectedIndex].text;
    recipeSite = recipeSite.replaceAll(' ', '+');

    let keywords = document.getElementById('input-recipe-keyword').value;
    keywords = keywords.replaceAll(' ', '+');

    let url = `/search-recipes?recipeSite=${recipeSite}&keywords=${keywords}`;
    makeGetRequest(url = url)
        .then((data) => {
            displaySearchResults(data);
        })
        .catch(err => {
            console.log(err);
        });
}

/**
 * Displays results of recipe search
 * @param {object} searchResults 
 */
function displaySearchResults(searchResults) {
    const searchResultsContainer = document.getElementById('search-results-container');
    searchResultsContainer.innerHTML = "";

    // TODO Error check that there are some results

    searchResults.map((result, index) => {
        const resultCardHtml = `<div class="card col-md-8 mb-3 mx-auto" id="card-${index}">
                                    <div class="row g-0">
                                    <div class="col-md-4">
                                        <img src="${result.pagemap.cse_image[0].src}" class="rounded-start h-100 w-100 googleThumbnail" alt="Image preview for link">
                                    </div>
                                    <div class="col-md-8">
                                        <div class="card-body">
                                            <h3 class="card-title"><a class='text-dark ${index}' href='${result.link}'>${result.htmlTitle}</a></h3>
                                            <p class="card-text">${result.htmlSnippet}</p>
                                            <div class="d-grid gap-2 d-md-block">
                                                <!-- <button class="btn btn-light" id="view-btn-${index}" type="button">View Recipe Information</button> --> <!-- Gets Recipe Info -->
                                                <button class="save-btn btn btn-dark" id="save-btn-${index}" type="button" onclick="saveRecipe(event);">Save Recipe</button> <!-- Gets Recipe Info and Saves, redirects to /recipes -->
                                            </div>                                    
                                        </div>
                                    </div>
                                    </div>
                                </div>`;
        searchResultsContainer.innerHTML += resultCardHtml;
    });
}

/**
 * Saves a recipe.
 * @param {event} event 
 */
function saveRecipe(event) {

    resetDisplayError();

    // Disable all other buttons to prevent multiple submissions
    disableSaveButtons();

    const cardElement = event.target.parentNode.parentNode;
    let recipeUrl = cardElement.querySelector('a').getAttribute('href');
    const cardParentElement = cardElement.parentNode.parentNode;
    let recipeImageUrl = cardParentElement.querySelector('img').getAttribute('src');
    const url = '/save-recipe';

    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    makePostRequest(url, { recipeUrl: recipeUrl, recipeImageUrl: recipeImageUrl })
        .then(() => {
            getSavedRecipesFromServer();
        })
        .catch(err => {
            console.log(err);
        });
}

/**
 * Disables all save buttons after clicking to prevent multiple submissions.
 */
function disableSaveButtons() {
    let saveButtons = Array.from(document.getElementsByClassName('save-btn'));
    console.log("saved", saveButtons);
    saveButtons.forEach(button => {
        button.classList.add("disabled");
        console.log(button);
    });
}

/**
 * Resets error display
 */
function resetDisplayError() {
    let alert = document.getElementById('alert');
    if (alert) {
        alert.remove();
    }
}

/**
 * Displays the error to user.
 * @param {string} errorString error string to display
 */
function handleDisplayError(errorString) {
    resetDisplayError();
    let siblingElement = document.getElementById('a-new-recipe');
    let errorDivHtml = `<div class="col-md-6 alert alert-warning mt-2 mx-auto" role="alert" id="alert">
                            ${errorString}
                        </div>`
    siblingElement.insertAdjacentHTML("afterend", errorDivHtml);
}
