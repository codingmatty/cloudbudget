'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

var _auth = require('./auth/auth');

var _auth2 = _interopRequireDefault(_auth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import favicon from 'serve-favicon';

// import path from 'path';

var app = (0, _express2.default)();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

if (app.get('env') === 'development') {
  app.use((0, _morgan2.default)('dev'));
}
// app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(express.static('public'));
app.use((0, _cookieParser2.default)());
app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: false }));

app.use(_passport2.default.initialize());
app.use(_passport2.default.session());
(0, _auth2.default)();

app.use('/api/v1', _api2.default);
if (app.get('env') === 'production') {
  app.use('/static', _express2.default.static(__dirname + '/public/static'));
  app.get('/*', function (req, res) {
    res.sendFile('/public/index.html', { root: __dirname + '/' });
  });
} else {
  app.use('/static', _express2.default.static(__dirname + '/../public/dist/static'));
  app.get('/*', function (req, res) {
    res.sendFile('/public/dist/index.html', { root: __dirname + '/../' });
  });
}

// catch 404 and forwarding to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// no stacktraces leaked to user if in production mode
app.use(function (err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});

var port = process.env.PORT || 8090;
if (app.get('env') === 'production') {
  (function () {
    var options = {
      key: _fs2.default.readFileSync('private.cloudbudget.pem'),
      cert: _fs2.default.readFileSync('0001_chain.pem')
    };
    var server = _https2.default.createServer(options, app);
    server.listen(port, function () {
      var host = server.address().address;
      /* eslint-disable no-console */
      console.log('Example app listening at %s:%s', host, port);
    });
  })();
} else {
  (function () {
    var server = app.listen(port, function () {
      var host = server.address().address;
      /* eslint-disable no-console */
      console.log('Example app listening at %s:%s', host, port);
    });
  })();
}

exports.default = app;