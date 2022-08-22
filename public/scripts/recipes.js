let searchResults;

window.addEventListener('load', () => {
    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    makeFetchRequest(url = '/recipe-info?recipe=https://www.bbcgoodfood.com/recipes/marrow-pecan-cake-maple-icing', params = '')
        .then((data) => {
            console.log(data);
        }).catch(err => {console.log(err);});
});

// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function makeFetchRequest(url, params) {
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
            console.log(response);
            throw new Error(`There was an error connecting to the server (Response: ${response.status})`);
        }
        return response.json();
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

function showSavedRecipes() {
    resetFormError();
    let searchResultsContainer = document.getElementById('search-results-container');
    searchResultsContainer.innerHTML = "";
    linkGoesToAddRecipe();
    let searchBox = document.getElementById('search-box-container');
    searchBox.innerHTML = "";
    // Then show all recipes
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
    resetFormError();
    const siteSelect = document.getElementById('select-recipe-source');
    let recipeSite = siteSelect.options[siteSelect.selectedIndex].text;
    recipeSite = recipeSite.replaceAll(' ', '+');

    let keywords = document.getElementById('input-recipe-keyword').value;
    keywords = keywords.replaceAll(' ', '+');

    let url = `/search-recipes?recipeSite=${recipeSite}&keywords=${keywords}`;
    makeFetchRequest(url = url, params = '')
        .then((data) => {
            searchResults = data;
            displaySearchResults(data);
        }).catch(err => { 
            handleFormError(err.message);
        });
}

function displaySearchResults(searchResults) {
    const searchResultsContainer = document.getElementById('search-results-container');
    searchResultsContainer.innerHTML = "";

    // TODO Error check that there are some results

    searchResults.map(result => {
        console.log(result.pagemap.cse_thumbnail[0]);
        const resultCardHtml = `<div class="card col-md-8 mb-3 mx-auto">
                            <div class="row g-0">
                            <div class="col-md-4">
                                <img src="${result.pagemap.cse_image[0].src}" class="rounded-start h-100 w-100 googleThumbnail" alt="Image preview for link">
                            </div>
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h5 class="card-title"><a class='text-dark' href='${result.link}'>${result.htmlTitle}</a></h5>
                                    <p class="card-text">${result.htmlSnippet}</p>
                                    <div class="d-grid gap-2 d-md-block">
                                        <button class="btn btn-light" type="button">View Recipe Information</button> <!-- Gets Recipe Info -->
                                        <button class="btn btn-light" type="button">Save Recipe</button> <!-- Gets Recipe Info and Saves, redirects to /recipes -->
                                    </div>                                    
                                </div>
                            </div>
                            </div>
                        </div>`
        searchResultsContainer.innerHTML += resultCardHtml;
    });
}

function resetFormError() {
    let alert = document.getElementById('alert');
    if (alert) {
        alert.remove();
    }
}

function handleFormError(errorString) {
    let siblingElement = document.getElementById('a-new-recipe');
    let errorDivHtml = `<div class="col-md-6 alert alert-warning mt-2 mx-auto" role="alert" id="alert">
                            ${errorString}
                        </div>`
    siblingElement.insertAdjacentHTML("afterend", errorDivHtml);
}
