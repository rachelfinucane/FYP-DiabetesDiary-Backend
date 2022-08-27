require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');
const passport = require('passport');
const logger = require('morgan');
const Redis = require('ioredis');
const redisStore = require("connect-redis")(session);

const client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const logsRouter = require('./routes/logs');
const recipesRouter = require('./routes/recipes');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: process.env.REDIS_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new redisStore({ client: client }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        }
    })
);

app.use(csrf());
app.use(passport.authenticate('session'));

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', logsRouter);
app.use('/', recipesRouter);

module.exports = app;