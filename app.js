var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require('express-handlebars')

var session = require('express-session')

var app = express();

var multer = require('multer')

var bodyParser = require('body-parser')

const flash = require('connect-flash')



//monogdb

var db = require('./config/connection')

//calling monog connection

db.connect((err) => {
  if (err) console.log('connection error' + err);
  else console.log("database connected");
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
//setting up partials
app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialDir: __dirname + '/views/partials/' }))

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session
app.use(session({ secret: 'key', resave: true, saveUninitialized: true, cookie: { maxAge: 6000000 } }))


app.use(bodyParser.urlencoded({ extended: false }))

app.use(flash())



app.use('/', userRouter);
app.use('/admin', adminRouter);



// session

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
  res.render('error', { admin: true, otp: true });
});

module.exports = app;
