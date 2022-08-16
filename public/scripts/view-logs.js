window.addEventListener('load', (event) => {
    console.log("csrfToken ", document.getElementById('csrf-token').content);

    fetchLogs('/logs')
        .then((data) => {
            console.log(data); // JSON data parsed by `data.json()` call
        });
});

async function fetchLogs(url) {
    const token = document.getElementById('csrf-token').content;

    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            'CSRF-Token': token
        },
        method: 'GET',
        mode: 'same-origin'
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

