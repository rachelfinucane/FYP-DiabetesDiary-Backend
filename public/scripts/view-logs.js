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

function displayData(singleLog, index) {
    cardGroup = document.getElementById('log-display-card-group');

    let newCard = document.createElement('div');
    newCard.className = 'card-body';
    newCard.id = 'card ' + index;
    newCard.id = `card-${index}`;

    let time = new Date(Date.parse(singleLog.logTime));
    console.log(typeof time);
    let timeString = time.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    let timeHeader = document.createElement('h5');
    timeHeader.className = 'card-title';
    timeHeader.innerHTML = timeString;

    newCard.appendChild(timeHeader);
    cardGroup.appendChild(newCard);

    // <div class="card">
    //     <div class="card-body">
    //         <h5 class="card-title">9th Aug 2022 @ 21:00</h5>
    //         <div class="mb-3">
    //             <div class="input-group mb-3">
    //                 <input class="form-control" type="text" value="6.7"
    //                     aria-label="Disabled input example" disabled readonly>
    //                     <span class="input-group-text" id="basic-addon2">mmol/mol</span>
    //             </div>
    //             <div class="input-group mb-3">
    //                 <span class="input-group-text" id="basic-addon2">Dinner</span>
    //                 <input class="form-control" type="text" value="50"
    //                     aria-label="Disabled input example" disabled readonly>
    //                     <span class="input-group-text" id="basic-addon2">grams Carbs</span>
    //             </div>
    //             <div class="input-group mb-3">
    //                 <input class="form-control" type="text" value="6.5"
    //                     aria-label="Disabled input example" disabled readonly>
    //                     <span class="input-group-text" id="basic-addon2">Units Novorapid</span>
    //             </div>
    //         </div>
    //     </div>
    // </div>
}

