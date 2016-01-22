'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _express = require('express');

var _oauth = require('../auth/oauth2');

var _oauth2 = _interopRequireDefault(_oauth);

var _db = require('../db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api = new _express.Router();

// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectURI` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `done` callback must be invoked with
// a `client` instance, as well as the `redirectURI` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view.

api.get('/authorization', _passport2.default.authenticate('jwt', { session: false }), _oauth2.default.authorization(function (clientId, redirectURI, done) {
  _db.Client.findById(clientId, function (err, client) {
    if (err) {
      return done(err);
    }
    if (client.redirectUrl !== redirectURI) {
      return done(null, client, false);
    }
    return done(null, client, redirectURI);
  });
}), function (req, res) {
  res.json({ transactionId: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
});

// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

api.post('/decision', _passport2.default.authenticate('jwt', { session: false }), _oauth2.default.decision());

// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

api.post('/token', _passport2.default.authenticate(['basic', 'oauth2-client-password'], { session: false }), _oauth2.default.token(), _oauth2.default.errorHandler());

exports.default = api;