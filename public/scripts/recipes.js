window.addEventListener('load', () => {
    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    makeFetchRequest(url = '/recipe-info?recipe=https://www.bbcgoodfood.com/recipes/marrow-pecan-cake-maple-icing', params = '')
        .then((data) => {
            console.log(data);
        });
});

// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function makeFetchRequest(url, params) {
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

function showSearchBox() {
    linkGoesToRecipes();

    let searchBox = document.createElement('div');
    searchBox.setAttribute('id', 'search-box');
    const searchBoxHtml =
        `<form onsubmit='searchRecipes(event);' class="row mx-auto g-3">
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
                <button class="btn btn-dark">Search</button>
            </div>
            
        </form>`

    searchBox.innerHTML = searchBoxHtml;

    const formContainer = document.getElementById('search-box-container');
    formContainer.innerHTML = searchBoxHtml;
}

function showSavedRecipes() {
    linkGoesToAddRecipe();
    let searchBox = document.getElementById('search-box');
    searchBox.remove();

    // Then show all recipes
}

function linkGoesToAddRecipe() {
    let link = document.getElementById('a-new-recipe');
    link.innerHTML = 'Add new recipe';
    link.setAttribute('onclick', 'showSearchBox(event);');
}

function linkGoesToRecipes() {
    let link = document.getElementById('a-new-recipe');
    link.innerHTML = 'Back to recipes';
    link.setAttribute('onclick', 'showSavedRecipes(event);');
}

function searchRecipes(event) {
    event.preventDefault();
    const siteSelect = document.getElementById('select-recipe-source');
    let recipeSite = siteSelect.options[siteSelect.selectedIndex].text;
    recipeSite = recipeSite.replaceAll(' ', '+');

    let keywords = document.getElementById('input-recipe-keyword').value;
    keywords = keywords.replaceAll(' ', '+');

    let url = `/search-recipes?recipeSite=${recipeSite}&keywords=${keywords}`;
    makeFetchRequest(url = url, params = '')
        .then((data) => {
            displaySearchResults(data);
        });
}

function displaySearchResults(searchResults) {
    const searchResultsContainer = document.getElementById('search-results-container');
    searchResultsContainer.innerHTML = "";

    searchResults.map(result => {
        console.log(result.pagemap.cse_thumbnail[0]);
        const resultCardHtml = `<div class="card mb-3 mx-auto" style="max-width: 700px;">
                            <div class="row g-0">
                            <div class="col-md-4">
                                <img src="${result.pagemap.cse_image[0].src}" class="rounded-start h-100 w-100 googleThumbnail" alt="Image preview for link">
                            </div>
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h5 class="card-title"><a class='text-dark' href='${result.link}'>${result.htmlTitle}</a></h5>
                                    <p class="card-text">${result.htmlSnippet}</p>
                                    <div class="d-grid gap-2 d-md-block">
                                        <button class="btn btn-light" type="button">View Recipe Information</button>
                                        <button class="btn btn-light" type="button">Save Recipe</button>
                                    </div>                                    
                                </div>
                            </div>
                            </div>
                        </div>`
        searchResultsContainer.innerHTML += resultCardHtml;
    });

}
