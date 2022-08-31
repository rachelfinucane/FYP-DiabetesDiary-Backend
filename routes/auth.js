/**
 * This file handles all auth routing.
 */

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oidc');
const FacebookStrategy = require('passport-facebook');

const { verifyUser, getUser } = require('../services/service_users')

/**
 * Set up passport to use Google validation.
 * If validation is successful, the callback function is called.
 * This inserts a new user if one does not exist.
 * cb(null, user) adds the user to req.user
 * 
 * Passport docs
 */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile']
}, async (issuer, profile, cb) => {
    try {
        let user = await verifyUser(issuer, profile);
        return cb(null, user);
    }
    catch (err) {
        console.log(err);
        return cb(err);
    }

}));


/**
 * Not used in the end: Facebook itself threw errors 
 * when trying to set up an app in their developer console.
 * I suspect I have to verify myself and I don't want to give them
 * a copy of my passport.
 * 
 * Set up passport to use Facebook validation.
 * If validation is successful, the callback function is called.
 * This inserts a new user if one does not exist.
 * cb(null, user) adds the user to req.user
 * 
 * Passport docs
 */
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: '/oauth2/redirect/facebook',
    profileFields: ["email", "name"]
}, async (accessToken, refreshToken, profile, cb) => {
    try {
        console.log(accessToken, refreshToken, profile);
        let user = await verifyUser('facebook.com', profile);
        return cb(null, user);
    }
    catch (err) {
        console.log(err);
        return cb(err);
    }

}));

/**
 * Passport needs to pull the user in and out of the session.
 * Here, add the user to the session.
 */
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.userId });
    });
});

/**
 * Pull the userId out of the session and find the details
 * in the database.
 */
passport.deserializeUser(async function (user, cb) {
    process.nextTick(async function () {
        let fullUserDetails = await getUser(user.id);
        if (fullUserDetails) {
            return cb(null, fullUserDetails);
        } else {
            return cb(null, false);
        }
    });
});


const router = express.Router();

/**
 * Middleware that checks if the user is logged in.
 */
const userAuthCheck = function (req, res, next) {
    if (!req.user) {
        console.log("Auth check failed. Redirecting to login.");
        return res.render('login');
    }
    next();
}

/**
 * GET /login
 * Route renders the login page.
 */
router.get('/login', function (req, res, next) {
    res.render('login');
});


/**
 * GET /login/federated/google
 * When user clicks on 'continue with google', the middleware called is the 
 * passport google authentication. If that is successful, the callback function
 * associated with that strategy is called. 
 */
router.get('/login/federated/google', passport.authenticate('google'));

/**
 * On authentication with Google, the user is redirected to Home.
 * If unsuccessful, they are redirected to login.
 */
router.get('/oauth2/redirect/google', passport.authenticate('google', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
}));

/**
 * GET /login/federated/facebook
 * When user clicks on 'continue with facebook', the middleware called is the 
 * passport facebook authentication. If that is successful, the callback function
 * associated with that strategy is called. 
 */
router.get('/login/federated/facebook', passport.authenticate('facebook'));

/**
 * On authentication with Facebook, the user is redirected to Home.
 * If unsuccessful, they are redirected to login.
 */
router.get('/oauth2/redirect/facebook', passport.authenticate('facebook', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login'
}));

/**
 * User logs out here. They are redirected to home
 */
router.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { 
            console.log(err);
            return next(err); 
        }
        res.redirect('/');
    });
});

module.exports = router;
