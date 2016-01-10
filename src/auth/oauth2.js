import _ from 'lodash';
import oauth2orize from 'oauth2orize';
import { Types } from 'mongoose';
import { Client, AccessToken, User } from '../db';

const authorizationCodes = {};

// create OAuth 2.0 server
const server = oauth2orize.createServer();

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

server.serializeClient((client, done) => {
  return done(null, client.id);
});

server.deserializeClient((id, done) => {
  Client.findById(id, (err, client) => {
    if (err) { return done(err); }
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

server.grant(oauth2orize.grant.code((client, redirectURI, user, ares, done) => {
  const authCodeId = new Types.ObjectId();
  authorizationCodes[authCodeId] = {
    clientId: client.id,
    redirectURI,
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


server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
  Client.findOne({ clientId: client.clientId }, (findClientErr, dbClient) => {
    if (findClientErr) { return done(findClientErr); }
    if (!dbClient) { return done(null, false); }
    if (dbClient.clientSecret !== client.clientSecret) { return done(null, false); }
    if (!_.includes(dbClient.permissions, 'password')) { return done(null, false); }
    if (!username) { return done(null, false); }
    User.findOne({ username }, (findUserErr, user) => {
      if (findUserErr) { return done(findUserErr); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      AccessToken.create({
        clientId: client.id,
        userId: user.id
      }, (err, accessToken) => {
        if (err) { return done(err); }
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

server.exchange(oauth2orize.exchange.code((client, code, redirectURI, done) => {
  const authCode = authorizationCodes[code];
  if (!authCode) { return done(null, false); }
  if (client.id !== authCode.clientId) { return done(null, false); }
  if (!_.includes(client.permissions, 'code')) { return done(null, false); }
  if (redirectURI !== authCode.redirectURI) { return done(null, false); }
  delete authorizationCodes[code];
  AccessToken.create({
    userId: authCode.userId,
    clientId: authCode.clientId
  }, (saveErr, accessToken) => {
    if (saveErr) { return done(saveErr); }
    done(null, accessToken.token);
  });
}));


export default server;
