/**
 * This file contains several helper methods used across the project
 */

const express = require('express');

/**
 * Checks if an object is empty or not.
 * Objects with null parameters are not considered 
 * empty.
 * @param {Object} obj any object
 * @returns boolean
 */
// https://stackabuse.com/javascript-check-if-an-object-is-empty/
const objectNotEmpty = (obj) => {
    return Object.values(obj).length > 0 && obj.constructor === Object;
}

/***
 * Custom express middleware. 
 * Auth helper: checks if a user is logged in.
 * This should really go in the auth.js route file.
 * (TODO move if time)
 */
const userAuthCheck = function (req, res, next) {
    if (!req.user) {
        console.log("Auth check failed. Redirecting to login.");
        return res.render('login');
    }
    next();
}

/**
 * Checks if a string is null or whitespace.
 * Ref: wanted a replacement for IsNullOrWhiteSpace from C#
 * This had a replacement function: https://stackoverflow.com/a/5559461
 * @param {string} input any string
 * @returns boolean
 */
function isNullOrWhitespace(input) {

    if (typeof input === 'undefined' || input == null) return true;

    return input.replace(/\s/g, '').length < 1;
}

/**
 * Takes any number and rounds to the specified number
 * of places.
 * Ref https://learnersbucket.com/examples/javascript/learn-how-to-round-to-2-decimal-places-in-javascript/
 * @param {float} input float to round
 * @param {int} places how many places to round to
 * @returns float
 */
function roundDecimalPlaces(input, places) {
    const x = Math.pow(10, places);
    return Math.round(input * x) / x;
}

module.exports = { objectNotEmpty, userAuthCheck, isNullOrWhitespace, roundDecimalPlaces }