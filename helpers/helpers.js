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

module.exports = {objectNotEmpty, userAuthCheck}