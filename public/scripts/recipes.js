console.log('recipe');

window.addEventListener('load', () => {
    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    fetchLogs(url='/recipe-info?recipe=https://www.bbcgoodfood.com/recipes/lemony-prawn-courgette-tagliatelle', params='')
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