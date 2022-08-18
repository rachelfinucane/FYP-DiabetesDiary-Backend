var express = require('express');

// https://stackabuse.com/javascript-check-if-an-object-is-empty/
const objectNotEmpty = (obj) => {
    return Object.values(obj).length > 0 && obj.constructor === Object;
}

// Auth helper
const userAuthCheck = function (req, res, next) {
    if (!req.user) {
        console.log("Auth check failed. Redirecting to login.");
        return res.render('login');
    }
    next();
}

// Fetch helper
// Some boilerplate taken from here:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function fetchData(url) {
    // ref: https://www.npmjs.com/package/csurf
    // See 'Using Ajax' Section

    console.log('fetching from ', url);
    // const response = await fetch(url, {
    //     credentials: 'omit',
    //     method: 'GET'
    // });

    // return response;
}

module.exports = {objectNotEmpty, userAuthCheck, fetchData}