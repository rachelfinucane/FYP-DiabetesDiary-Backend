window.addEventListener('load', (event) => {
    fillDateTime();
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

    dateInput.setAttribute('valueAsDate', currentDate);
    timeInput.setAttribute('value', currentTime);
}
