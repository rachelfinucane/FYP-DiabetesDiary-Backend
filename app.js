require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var csrf = require('csurf');
var passport = require('passport');
var logger = require('morgan');
// const redis = require("redis");
const Redis = require('ioredis');
const redisStore = require("connect-redis")(session);

// pass the session to the connect sqlite3 module
// allowing it to inherit from session.Store
// var SQLiteStore = require('connect-sqlite3')(session);

// const client = redis.createClient(
//   process.env['REDIS_PORT'],
//   process.env['REDIS_HOST'],
//   {
//     auth_pass: 'ZJW7oSfyWxi35rSx1Wj9qE5MiqFHnOZ7IAzCaIsZlds=',
//     db: 0,
//   }
// );

// const client = redis.createClient(
//   {
//     port: process.env['REDIS_PORT'],
//     host: process.env['REDIS_HOST'],
//     auth_pass: process.env['REDIS_PASSWORD']
//   });

// client.on('error', err => {
//   console.log('Error ' + err);
// });

const client = new Redis({
  host: process.env['REDIS_HOST'],
  port: process.env['REDIS_PORT'],
  password: process.env['REDIS_PASSWORD']
});

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.locals.pluralize = require('pluralize');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'views')));

// app.use(session({
//   secret: 'keyboard cat',
//   resave: false, // don't save session if unmodified
//   saveUninitialized: false, // don't create session until something stored
//   store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' }) // todo: replace with redis cache
// }));

app.use(
  session({
    secret: process.env['REDIS_SECRET'],
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
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;
  req.session.messages = [];
  next();
});
app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/', indexRouter);
app.use('/', authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
