import fs from 'fs';
import moment from 'moment';
import passport from 'passport';
import { BasicStrategy } from 'passport-http';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Strategy as ClientPasswordStrategy } from 'passport-oauth2-client-password';
import { User, Client, AccessToken } from '../db';

export default function () {
  passport.use(new LocalStrategy({ session: false }, (username, password, done) => {
    User.findOne({ username }, (err, user) => {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      const token = user.generateJwt();
      user.save((saveErr) => { // Save nonce generated for JWT
        if (saveErr) { return done(saveErr); }
        user.token = token;
        done(null, user);
      });
    });
  }));

  const key = fs.readFileSync(__dirname + '//../../public.pem').toString();
  passport.use(new JwtStrategy({
    secretOrKey: key,
    issuer: 'admin@cloudbudget.io',
    audience: 'cloudbudget.io',
    algorithms: ['RS256'],
    tokenBodyField: 'token',
    tokenQueryParameterName: 'token'
  }, (jwtPayload, done) => {
    User.findOne({ _id: jwtPayload.id }, (err, user) => {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyNonce(jwtPayload.jti)) { return done(null, false); }
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
    Client.findOne({ clientId }, (err, client) => {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (!client.verifySecret(clientSecret)) { return done(null, false); }
      return done(null, client);
    });
  }
  passport.use(new BasicStrategy(verifyClientCredentials));
  passport.use(new ClientPasswordStrategy(verifyClientCredentials));

  /**
   * BearerStrategy
   *
   * This strategy is used to authenticate users based on an access token (aka a
   * bearer token).  The user must have previously authorized a client
   * application, which is issued an access token to make requests on behalf of
   * the authorizing user.
   */
  passport.use(new BearerStrategy((token, done) => {
    AccessToken.findOne({ token }, (tokenFindErr, accessToken) => {
      if (tokenFindErr) { return done(tokenFindErr); }
      if (!accessToken) { return done(null, false); }
      if (moment(accessToken.date).add(2, 'weeks') < moment()) { return done(null, false); }
      User.findById(accessToken.userId, (userFindErr, user) => {
        if (userFindErr) { return done(userFindErr); }
        if (!user) { return done(null, false); }
        user.token = accessToken.token;
        // to keep this example simple, restricted scopes are not implemented,
        // and this is just for illustrative purposes
        const info = { scope: '*' };
        done(null, user, info);
      });
    });
  }));
}
