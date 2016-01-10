import _ from 'lodash';
import bcrypt from 'bcrypt';
import moment from 'moment';
import timekeeper from 'timekeeper';
import { Types } from 'mongoose';
import { assert, factory } from 'chai';
import { clearCollections, httpClient, getJwtToken, getAccessToken, insertFactoryModel } from './helpers';
import { User, Client, AccessToken } from '../src/db';

describe('Users', function () {
  beforeEach(function (done) {
    insertFactoryModel('User', {
      username: 'test',
      password: bcrypt.hashSync('test', 8),
      email: 'test@test.com',
      nonce: 'abcdef012345'
    }, (err, user) => {
      if (err) return done(err);
      getJwtToken(user, (tokenErr, token) => {
        if (tokenErr) return done(tokenErr);
        user.token = token;
        this.user = user;
        done();
      });
    });
  });
  afterEach(function () {
    clearCollections(['users']);
  });
  it('should login a user', function (done) {
    httpClient('post', 'users/login', {
      body: {
        username: this.user.username,
        password: 'test'
      }
    }, 200, (err, res) => {
      if (err) return done(err);
      assert.equal(res.body.message, 'Login Succeeded!');
      assert(Types.ObjectId.isValid(res.body.data.id));
      assert.equal(res.body.data.username, 'test');
      assert.equal(res.body.data.email, 'test@test.com');
      getJwtToken(this.user, (tokenErr, token) => {
        if (tokenErr) return done(tokenErr);
        assert.equal(res.body.token, token);
        done();
      });
    });
  });
  it('should return user info', function (done) {
    httpClient('get', `users/info`, { jwtToken: this.user.token }, 200, (err, res) => {
      if (err) return done(err);
      assert.isUndefined(res.body.data._id);
      assert.isUndefined(res.body.data.password);
      assert.isUndefined(res.body.data.key);
      assert(Types.ObjectId.isValid(res.body.data.id));
      assert.match(res.body.data.username, /test/);
      assert.match(res.body.data.email, /test@test.com/);
      done();
    });
  });
  it('should logout a user', function (done) {
    httpClient('get', `users/logout`, { jwtToken: this.user.token }, 200, (err, res) => {
      if (err) return done(err);
      assert.equal(res.body.message, 'Logout Succeeded!');
      done();
    });
  });
  it('should not allow expired JWT', function (done) {
    timekeeper.travel(moment().add(1, 'days').toDate());
    httpClient('get', `users/info`, { jwtToken: this.user.token }, 401, done);
  });
  it('should be able to revoke JWT', function (done) {
    User.findByIdAndUpdate(this.user.id, { $unset: { nonce: 1 } }, { new: true }, (updateErr) => {
      if (updateErr) return done(updateErr);
      httpClient('get', `users/info`, { jwtToken: this.user.token }, 401, done);
    });
  });
  describe('Register', function () {
    beforeEach(function (done) {
      const newClient = _.merge({
        name: 'Test Client',
        permissions: ['password', 'code']
      }, Client.generateCredentials());
      Client.create(newClient, (err) => {
        if (err) return done(err);
        this.basicToken = new Buffer(`${newClient.clientId}:${newClient.secret}`).toString('base64');
        done();
      });
    });
    afterEach(function () {
      clearCollections(['clients']);
    });
    it('should register a user', function (done) {
      httpClient('post', 'users/register', { basicToken: this.basicToken, body: factory.create('User') }, 201, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User created.');
        assert(Types.ObjectId.isValid(res.body.data.id));
        assert.match(res.body.data.username, /User \d+/);
        assert.match(res.body.data.email, /user\d+@test.com/);
        done();
      });
    });
    it('should not register a duplicate username', function (done) {
      httpClient('post', 'users/register', { basicToken: this.basicToken, body: factory.create('User', { username: 'test' }) }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User.');
        assert.equal(res.body.error.username, `username 'test' already exists.`);
        done();
      });
    });
    it('should not register a duplicate email', function (done) {
      httpClient('post', 'users/register', { basicToken: this.basicToken, body: factory.create('User', { email: 'test@test.com' }) }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User.');
        assert.equal(res.body.error.email, `email 'test@test.com' already exists.`);
        done();
      });
    });
    it('should not register an invalid email', function (done) {
      httpClient('post', 'users/register', { basicToken: this.basicToken, body: factory.create('User', { email: 'test' }) }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User.');
        assert.equal(res.body.error.email, 'test is not a valid email address.');
        done();
      });
    });
  });
  describe('Update', function () {
    it('should update username', function (done) {
      httpClient('put', `users/${this.user.id}`, {
        jwtToken: this.user.token,
        body: {
          username: 'newUser'
        }
      }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User updated.');
        assert.equal(res.body.data.username, 'newUser');
        done();
      });
    });
    it('should update email', function (done) {
      httpClient('put', `users/${this.user.id}`, {
        jwtToken: this.user.token,
        body: {
          email: 'newUser@test.com'
        }
      }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User updated.');
        assert.equal(res.body.data.email, 'newUser@test.com');
        done();
      });
    });
    it('should update password (and invalidate any outstanding access tokens)', function (done) {
      httpClient('put', `users/${this.user.id}`, {
        jwtToken: this.user.token,
        body: {
          password: 'newPassword'
        }
      }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User updated.');
        assert.isUndefined(res.body.password);
        User.findById(this.user.id, (queryErr, user) => {
          if (queryErr) return done(queryErr);
          assert.isUndefined(user.key);
          bcrypt.compare('newPassword', user.password, (hashErr, result) => {
            if (hashErr) return done(hashErr);
            assert(result);
            done();
          });
        });
      });
    });
  });
  describe('OAuth2', function () {
    beforeEach(function (done) {
      const newClient = _.merge({
        name: 'Test Client',
        permissions: ['password', 'code']
      }, Client.generateCredentials());
      Client.create(newClient, (err, dbClient) => {
        if (err) return done(err);
        this.client = _.merge(newClient, dbClient.toJSON());
        done();
      });
    });
    afterEach(function () {
      clearCollections(['clients']);
    });
    describe('Password Exchange', function () {
      it('should provide access token', function (done) {
        httpClient('post', 'oauth2/token', {
          body: {
            client_id: this.client.clientId,
            client_secret: this.client.secret,
            username: this.user.username,
            password: 'test',
            grant_type: 'password'
          }
        }, 200, (err, res) => {
          if (err) return done(err);
          assert.equal(res.body.token_type, 'Bearer');
          AccessToken.findOne({ token: res.body.access_token }, (findErr, accessToken) => {
            if (findErr) return done(findErr);
            assert.equal(accessToken.userId, this.user.id);
            assert.equal(accessToken.clientId, this.client.id);
            assert.ok(accessToken.refreshToken);
            done();
          });
        });
      });
      it('should not provide access token - no client info', function (done) {
        httpClient('post', 'oauth2/token', {
          body: {
            username: this.user.username,
            password: 'test',
            grant_type: 'password'
          }
        }, 401, done);
      });
      it('should not provide access token - no user info', function (done) {
        httpClient('post', 'oauth2/token', {
          body: {
            client_id: this.client.clientId,
            client_secret: this.client.secret,
            grant_type: 'password'
          }
        }, 400, done);
      });
    });
    describe('Refresh Token Exchange', function () {
      it('should provide user access token', function () {

      });
    });
    describe('Authorization Code Exchange', function () {
      it('should provide user access token', function () {

      });
    });
    it('should be able to revoke access token', function (done) {
      getAccessToken(this.user, (err, accessToken) => {
        if (err) return done(err);
        httpClient('get', `users/revoke`, { accessToken: accessToken.token }, 200, (revokeErr) => {
          if (revokeErr) return done(revokeErr);
          httpClient('get', `users/info`, { accessToken: accessToken.token }, 401, done);
        });
      });
    });
    it('should be able to revoke client access', function (done) {
      Client.findByIdAndRemove(this.client.id, (err) => {
        if (err) done(err);
        httpClient('post', 'oauth2/token', {
          client_id: this.client.clientId,
          client_secret: this.client.secret,
          username: this.user.username,
          password: 'test',
          grant_type: 'password'
        }, 401, done);
      });
    });
  });
});
