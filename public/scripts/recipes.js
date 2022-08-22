console.log('recipe');

window.addEventListener('load', () => {
    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    fetchLogs(url = '/recipe-info?recipe=https://www.bbcgoodfood.com/recipes/marrow-pecan-cake-maple-icing', params = '')
        .then((data) => {
            console.log(data);
        });
});

// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function fetchLogs(url, params) {
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
        `<form class="row row-cols-lg-auto g-3 align-items-center">
            <div class="col-12">
                <label class="visually-hidden" for="input-recipe-keyword">Recipe keywords</label>
                <input type="search" class="form-control" id="input-recipe-keyword"
                    placeholder="Search for a recipe" required>
            </div>

            <div class="col-12">
                <label class="visually-hidden" for="select-recipe-source">Preference</label>
                <select class="form-select" id="select-recipe-source" required>
                    <option selected disabled value="">Select a website</option>
                    <option value="1">BBC Goodfood</option>
                    <option value="2">MyRecipes [experimental]</option>
                </select>
            </div>

            <div class="col-12">
                <button type="submit" class="btn btn-dark">Search</button>
            </div>
        </form>`

    searchBox.innerHTML = searchBoxHtml;

    const formContainer = document.getElementById('search-box-container');
    formContainer.appendChild(searchBox);
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
