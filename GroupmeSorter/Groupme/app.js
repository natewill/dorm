var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fs = require('fs');
const https = require('https');



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
/*
const keyPath = '../../.secure-keys/localhost+1-key.pem';
const certPath = '../../.secure-keys/localhost+1.pem';

const secureOptions = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
};

// Create HTTPS server
const server = https.createServer(secureOptions, app);

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});
*/

const server = app.listen(process.env.PORT || 8080, () => {
  const host = server.address().address
  const port = server.address().port

  console.log(`Dormie running at https://${host}:${port}`)
})

module.exports = app;
