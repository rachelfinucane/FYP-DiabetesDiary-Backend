let searchResults;

window.addEventListener('load', () => {
    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    // makeFetchRequest(url = '/recipe-info?recipe=https://www.bbcgoodfood.com/recipes/marrow-pecan-cake-maple-icing', params = '')
    //     .then((data) => {
    //         console.log(data);
    //     }).catch(err => {console.log(err);});

    makeGetRequest(url = '/recipes/userId', params = '')
        .then((data) => {
            console.log(data);
            showSavedRecipes(data);
        }).catch(err => { console.log(err); });
});

// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function makeGetRequest(url) {
    // ref: https://www.npmjs.com/package/csurf
    // See 'Using Ajax' Section
    const token = document.getElementById('csrf-token').content;
    console.log(token);

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
    }).then(response => {
        if (response.status != 200) {
            throw new Error(`There was an error connecting to the server (Response: ${response.status})`);
        }
    });

}

function showSearchBox() {
    linkGoesToViewRecipes();
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
            
        </form>`
    let searchBoxContainer = document.getElementById('search-box-container');
    searchBoxContainer.innerHTML = searchBoxHtml;
}

function showSavedRecipes(recipes) {
    resetDisplayError();
    let searchResultsContainer = document.getElementById('search-results-container');
    searchResultsContainer.innerHTML = "";
    linkGoesToAddRecipe();
    let searchBox = document.getElementById('search-box-container');
    searchBox.innerHTML = "";
    
    // Then show all recipes
    const recipeDisplayContainer = document.getElementById('recipe-display-container');
    recipeDisplayContainer.innerHTML = "";

    recipes.map(recipe => {
        let recipeCardHtml = `<div class="card col-md-8 mb-3 mx-auto" id="card">
                                    <div class="row g-0">
                                        <div class="col-md-8">
                                            <div class="card-body">
                                                <h5 class="card-title">${recipe.recipeName}</a></h5>
                                                <p class="card-text">${recipe.recipeInstructions}</p>                                   
                                            </div>
                                        </div>
                                    </div>
                                </div>`

        recipeDisplayContainer.innerHTML += recipeCardHtml;

    });
}

function linkGoesToAddRecipe() {
    let link = document.getElementById('a-new-recipe');
    link.innerHTML = 'Add new recipe';
    link.setAttribute('onclick', 'showSearchBox(event);');
}

function linkGoesToViewRecipes() {
    let link = document.getElementById('a-new-recipe');
    link.innerHTML = 'Back to recipes';
    link.setAttribute('onclick', 'showSavedRecipes(event);');
}

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
            console.log(data);
            displaySearchResults(data);
        }).catch(err => {
            handleDisplayError(err.message);
        });
}

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
                                            <h5 class="card-title"><a class='text-dark ${index}' href='${result.link}'>${result.htmlTitle}</a></h5>
                                            <p class="card-text">${result.htmlSnippet}</p>
                                            <div class="d-grid gap-2 d-md-block">
                                                <!-- <button class="btn btn-light" id="view-btn-${index}" type="button">View Recipe Information</button> --> <!-- Gets Recipe Info -->
                                                <button class="btn btn-light" id="save-btn-${index}" type="button" onclick="saveRecipe(event);">Save Recipe</button> <!-- Gets Recipe Info and Saves, redirects to /recipes -->
                                            </div>                                    
                                        </div>
                                    </div>
                                    </div>
                                </div>`;
        searchResultsContainer.innerHTML += resultCardHtml;
    });
}

function saveRecipe(event) {
    const cardElement = event.target.parentNode.parentNode;
    let recipeUrl = cardElement.querySelector('a').getAttribute('href');
    const url = '/save-recipe';

    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    makePostRequest(url, { recipeUrl: recipeUrl })
        .then(() => {
            showSavedRecipes();
        })
        .catch(err => { console.log(err) });
}

function resetDisplayError() {
    let alert = document.getElementById('alert');
    if (alert) {
        alert.remove();
    }
}

function handleDisplayError(errorString) {
    resetDisplayError();
    let siblingElement = document.getElementById('a-new-recipe');
    let errorDivHtml = `<div class="col-md-6 alert alert-warning mt-2 mx-auto" role="alert" id="alert">
                            ${errorString}
                        </div>`
    siblingElement.insertAdjacentHTML("afterend", errorDivHtml);
}
