const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const config = require('config');

const catalog = require('./routes/catalog');  //Import routes for "catalog" area of site
const selection = require('./routes/selection');  //Import routes for "selection" area of site

const compression = require('compression'); //All routes are compressed
const helmet = require('helmet'); //sets appropriate HTTP headers

const app = express();
app.use(compression()); //Compress all routes
app.use(helmet());

const ENV = config.util.getEnv('NODE_ENV');
//don't show the log when it is test
if(ENV !== 'test') {
  //use morgan to log at command line
  app.use(logger('dev'));
}

app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressValidator());

// Set the MIME type explicitly
express.static.mime.define({'application/wasm': ['wasm']});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'))
app.use('/catalog', catalog);
app.use('/selection', selection);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
