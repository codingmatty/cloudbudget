import passport from 'passport';
import { Router } from 'express';
import { Client } from '../db';
import server from '../auth/oauth2';

const api = new Router();

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

api.get('/authorization', passport.authenticate('jwt', { session: false }), server.authorization((clientId, redirectURI, done) => {
  Client.findById(clientId, (err, client) => {
    if (err) { return done(err); }
    // WARNING: For security purposes, it is highly advisable to check that
    //          redirectURI provided by the client matches one registered with
    //          the server.  For simplicity, this example does not.  You have
    //          been warned.
    return done(null, client, redirectURI);
  });
}), (req, res) => {
  res.json({ transactionId: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
});

// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.

api.post('/decision', passport.authenticate('jwt', { session: false }), server.decision());


// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.

api.post('/token',
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler());

export default api;
