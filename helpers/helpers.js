const express = require('express');

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

// Ref: wanted a replacement for IsNullOrWhiteSpace from C#
// This had a replacement function: https://stackoverflow.com/a/5559461
function isNullOrWhitespace(input) {

    if (typeof input === 'undefined' || input == null) return true;

    return input.replace(/\s/g, '').length < 1;
}

// Ref https://learnersbucket.com/examples/javascript/learn-how-to-round-to-2-decimal-places-in-javascript/
function roundDecimalPlaces(input, places) {
    const x = Math.pow(10, places);
    return Math.round(input * x) / x;
}

module.exports = { objectNotEmpty, userAuthCheck, isNullOrWhitespace, roundDecimalPlaces }