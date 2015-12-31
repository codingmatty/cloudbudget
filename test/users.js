import { client, insertUser, getAccessToken } from './helpers';
import { assert } from 'chai';
import bcrypt from 'bcrypt';
import db, { User } from '../src/db';

describe('Users', function () {
  beforeEach(function (done) {
    const self = this;
    insertUser((err, user) => {
      if (err) return done(err);
      getAccessToken((tokenErr, token) => {
        if (tokenErr) return done(tokenErr);
        self.user = user;
        self.token = token;
        done();
      });
    });
  });
  afterEach(function () {
    db.connection.db.collection('users').remove({});
  });
  it('should login a user', function (done) {
    client('post', 'users/login', {
      username: 'test', password: 'test'
    }, 200, (err, res) => {
      if (err) return done(err);
      assert.equal(res.body.message, 'Login Succeeded!');
      assert(res.body.data.id);
      assert.equal(res.body.data.username, 'test');
      assert.equal(res.body.data.email, 'test@test.com');
      getAccessToken((tokenErr, token) => {
        if (tokenErr) return done(tokenErr);
        assert.equal(res.body.token, token);
        done();
      });
    });
  });
  it('should return user info', function (done) {
    client('get', `users/info?token=${this.token}`, null, 200, (err, res) => {
      if (err) return done(err);
      assert.isUndefined(res.body.data._id);
      assert.isUndefined(res.body.data.password);
      assert.isUndefined(res.body.data.key);
      assert(res.body.data.id);
      assert.equal(res.body.data.username, 'test');
      assert.equal(res.body.data.email, 'test@test.com');
      done();
    });
  });
  it('should logout a user', function (done) {
    client('get', `users/logout?token=${this.token}`, null, 200, (err, res) => {
      if (err) return done(err);
      assert.equal(res.body.message, 'Logout Succeeded!');
      done();
    });
  });
  describe('Register', function () {
    it('should register a user', function (done) {
      client('post', 'users/register', {
        username: 'newUser1', password: 'test', email: 'newUser1@test.com'
      }, 201, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User created.');
        assert(res.body.data.id);
        assert.equal(res.body.data.username, 'newUser1');
        assert.equal(res.body.data.email, 'newUser1@test.com');
        done();
      });
    });
    it('should not register a duplicate username', function (done) {
      client('post', 'users/register', {
        username: 'test', password: 'test', email: 'newUser2@test.com'
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User.');
        assert.equal(res.body.error.username, `username 'test' already exists.`);
        done();
      });
    });
    it('should not register a duplicate email', function (done) {
      client('post', 'users/register', {
        username: 'newUser3', password: 'test', email: 'test@test.com'
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User.');
        assert.equal(res.body.error.email, `email 'test@test.com' already exists.`);
        done();
      });
    });
    it('should not register an invalid email', function (done) {
      client('post', 'users/register', {
        username: 'newUser4', password: 'test', email: 'test'
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User.');
        assert.equal(res.body.error.email, 'test is not a valid email address.');
        done();
      });
    });
  });
  describe('Update', function () {
    it('should update username', function (done) {
      client('put', `users/${this.user.id}?token=${this.token}`, {
        username: 'newUser5'
      }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User updated.');
        assert.equal(res.body.data.username, 'newUser5');
        done();
      });
    });
    it('should update email', function (done) {
      client('put', `users/${this.user.id}?token=${this.token}`, {
        email: 'newUser6@test.com'
      }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User updated.');
        assert.equal(res.body.data.email, 'newUser6@test.com');
        done();
      });
    });
    it('should update password (and invalidate any outstanding access tokens)', function (done) {
      const self = this;
      client('put', `users/${self.user.id}?token=${this.token}`, {
        password: 'newUser7password'
      }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User updated.');
        assert.isUndefined(res.body.password);
        User.findById(self.user.id, (queryErr, user) => {
          if (queryErr) return done(queryErr);
          assert.isUndefined(user.key);
          bcrypt.compare('newUser7password', user.password, (hashErr, result) => {
            if (hashErr) return done(hashErr);
            assert(result);
            done();
          });
        });
      });
    });
  });
});
