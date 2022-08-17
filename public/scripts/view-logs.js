window.addEventListener('load', (event) => {
    console.log("csrfToken ", document.getElementById('csrf-token').content);

    // Some boilerplate taken from here:
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    fetchLogs('/logs')
        .then((data) => {
            console.log(data);
            data.forEach(displayData);
        });
});

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

function displayData(singleLog) {
    cardGroup = document.getElementById('log-display-card-group');
}

