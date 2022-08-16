window.addEventListener('load', (event) => {
    console.log("<%= csrfToken %>");
    fillDateTime();
    // handleFormSubmit();
});

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleTimeString
//https://www.w3docs.com/snippets/javascript/how-to-get-the-current-date-and-time-in-javascript.html
//https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement


/**
 * Pre-fills the date and time inputs to the current time.
 */
function fillDateTime() {
    let timeInput = document.getElementById('time-input');
    let dateInput = document.getElementById('date-input');

    let currentDate = new Date();
    let currentTime = currentDate.toLocaleTimeString('en-IT', { hour: '2-digit', minute: '2-digit', hour12: false });

    dateInput.valueAsDate = currentDate;
    timeInput.value = currentTime;
}

// function handleFormSubmit() {
//     const submitButton = document.getElementById('submit-btn');

//     submitButton.addEventListener('click', (event) => {
//         const logForm = document.getElementById('log-form');
//         console.log(logForm);

//         const logData = new FormData(logForm);

//         postLog('/logs', logData)
//             .then((data) => {
//                 console.log(data);
//             });
//     });
// }


// // Fetch API documentation
// // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

// // Example POST method implementation:
// // async function postLog(url = '', data = {}) {
// //     const response = await fetch(url, {
// //         method: 'POST',
// //         body: data,
// //         headers: {
// //             'Content-Type': 'application/json'
// //         },
// //     });
// //     return response;
// // }  

// // Example POST method implementation:
// async function postLog(url, data) {
//     // Default options are marked with *
//     const response = await fetch(url, {
//       method: 'POST', // *GET, POST, PUT, DELETE, etc.
//       mode: 'same-origin', // no-cors, *cors, same-origin
//       cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
//       credentials: 'same-origin', // include, *same-origin, omit
//       headers: {
//         // 'Content-Type': 'application/json'
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       redirect: 'follow', // manual, *follow, error
//       referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
//       body: data // body data type must match "Content-Type" header
//     });
//     return response; // parses JSON response into native JavaScript objects
//   }