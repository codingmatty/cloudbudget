'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  _passport2.default.use(new _passportLocal.Strategy({ session: false }, function (username, password, done) {
    _db.User.findOne({ username: username }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      if (!user.verifyPassword(password)) {
        return done(null, false);
      }
      var token = user.generateJwt();
      user.save(function (saveErr) {
        // Save nonce generated for JWT
        if (saveErr) {
          return done(saveErr);
        }
        user.token = token;
        done(null, user);
      });
    });
  }));

  var key = _fs2.default.readFileSync(__dirname + '//../../public.pem').toString();
  _passport2.default.use(new _passportJwt.Strategy({
    secretOrKey: key,
    issuer: 'admin@cloudbudget.io',
    audience: 'cloudbudget.io',
    algorithms: ['RS256'],
    tokenBodyField: 'token',
    tokenQueryParameterName: 'token'
  }, function (jwtPayload, done) {
    _db.User.findOne({ _id: jwtPayload.id }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      if (!user.verifyNonce(jwtPayload.jti)) {
        return done(null, false);
      }
      return done(null, user);
    });
  }));

  /**
   * BasicStrategy & ClientPasswordStrategy
   *
   * These strategies are used to authenticate registered OAuth clients.  They are
   * employed to protect the `token` endpoint, which consumers use to obtain
   * access tokens.  The OAuth 2.0 specification suggests that clients use the
   * HTTP Basic scheme to authenticate.  Use of the client password strategy
   * allows clients to send the same credentials in the request body (as opposed
   * to the `Authorization` header).  While this approach is not recommended by
   * the specification, in practice it is quite common.
   */
  function verifyClientCredentials(clientId, clientSecret, done) {
    _db.Client.findOne({ clientId: clientId }, function (err, client) {
      if (err) {
        return done(err);
      }
      if (!client) {
        return done(null, false);
      }
      if (!client.verifySecret(clientSecret)) {
        return done(null, false);
      }
      return done(null, client);
    });
  }
  _passport2.default.use(new _passportHttp.BasicStrategy(verifyClientCredentials));
  _passport2.default.use(new _passportOauth2ClientPassword.Strategy(verifyClientCredentials));

  /**
   * BearerStrategy
   *
   * This strategy is used to authenticate users based on an access token (aka a
   * bearer token).  The user must have previously authorized a client
   * application, which is issued an access token to make requests on behalf of
   * the authorizing user.
   */
  _passport2.default.use(new _passportHttpBearer.Strategy(function (token, done) {
    _db.AccessToken.findOne({ token: token }, function (tokenFindErr, accessToken) {
      if (tokenFindErr) {
        return done(tokenFindErr);
      }
      if (!accessToken) {
        return done(null, false);
      }
      if ((0, _moment2.default)(accessToken.date).add(2, 'weeks') < (0, _moment2.default)()) {
        return done(null, false);
      }
      _db.User.findById(accessToken.userId, function (userFindErr, user) {
        if (userFindErr) {
          return done(userFindErr);
        }
        if (!user) {
          return done(null, false);
        }
        user.token = accessToken.token;
        // to keep this example simple, restricted scopes are not implemented,
        // and this is just for illustrative purposes
        var info = { scope: '*' };
        done(null, user, info);
      });
    });
  }));
};

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportHttp = require('passport-http');

var _passportJwt = require('passport-jwt');

var _passportLocal = require('passport-local');

var _passportHttpBearer = require('passport-http-bearer');

var _passportOauth2ClientPassword = require('passport-oauth2-client-password');

var _db = require('../db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }