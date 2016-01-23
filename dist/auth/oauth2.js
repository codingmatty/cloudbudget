'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _oauth2orize = require('oauth2orize');

var _oauth2orize2 = _interopRequireDefault(_oauth2orize);

var _mongoose = require('mongoose');

var _db = require('../db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var authorizationCodes = {};

// create OAuth 2.0 server
var server = _oauth2orize2.default.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function (client, done) {
  return done(null, client.id);
});

server.deserializeClient(function (id, done) {
  _db.Client.findById(id, function (err, client) {
    if (err) {
      return done(err);
    }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(_oauth2orize2.default.grant.code(function (client, redirectURI, user, ares, done) {
  var authCodeId = new _mongoose.Types.ObjectId();
  authorizationCodes[authCodeId] = {
    clientId: client.id,
    redirectURI: redirectURI,
    userId: user.id
  };
  done(null, authCodeId);
}));

// server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, scope, done) => {
//   AccessToken.remove({ refreshToken, clientId: client.clientId }, (err, token) => {
//     if (err) { return done(err); }
//     if (!token) { return done(null, false); }

//     User.findById(token.userId, (err, user) => {
//       if (err) { return done(err); }
//       if (!user) { return done(null, false); }

//       var model = {
//         userId: user.userId,
//         clientId: client.clientId
//       };

//       generateTokens(model, done);
//     });
//   });
// }));

server.exchange(_oauth2orize2.default.exchange.password(function (client, username, password, scope, done) {
  _db.Client.findOne({ clientId: client.clientId }, function (findClientErr, dbClient) {
    if (findClientErr) {
      return done(findClientErr);
    }
    if (!dbClient) {
      return done(null, false);
    }
    if (dbClient.clientSecret !== client.clientSecret) {
      return done(null, false);
    }
    if (!_lodash2.default.includes(dbClient.permissions, 'password')) {
      return done(null, false);
    }
    if (!username) {
      return done(null, false);
    }
    _db.User.findOne({ username: username }, function (findUserErr, user) {
      if (findUserErr) {
        return done(findUserErr);
      }
      if (!user) {
        return done(null, false);
      }
      if (!user.verifyPassword(password)) {
        return done(null, false);
      }
      _db.AccessToken.create(_lodash2.default.merge({
        clientId: client.id,
        userId: user.id
      }, _db.AccessToken.generateTokens()), function (err, accessToken) {
        if (err) {
          return done(err);
        }
        done(null, accessToken.token);
      });
    });
  });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(_oauth2orize2.default.exchange.code(function (client, code, redirectURI, done) {
  var authCode = authorizationCodes[code];
  if (!authCode) {
    return done(null, false);
  }
  if (client.id !== authCode.clientId) {
    return done(null, false);
  }
  if (!_lodash2.default.includes(client.permissions, 'code')) {
    return done(null, false);
  }
  if (redirectURI !== authCode.redirectURI) {
    return done(null, false);
  }
  delete authorizationCodes[code];
  _db.AccessToken.create(_lodash2.default.merge({
    userId: authCode.userId,
    clientId: authCode.clientId
  }, _db.AccessToken.generateTokens()), function (saveErr, accessToken) {
    if (saveErr) {
      return done(saveErr);
    }
    done(null, accessToken.token);
  });
}));

exports.default = server;