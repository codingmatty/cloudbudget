import { Types } from 'mongoose';
import { clearCollections, client, getAccessToken, insertFactoryModel } from './helpers';
import { assert, factory } from 'chai';
import bcrypt from 'bcrypt';
import db, { User } from '../src/db';

describe('Users', function () {
  beforeEach(function (done) {
    insertFactoryModel('User', {
      username: 'test',
      password: bcrypt.hashSync('test', 8),
      email: 'test@test.com',
      key: 'abcdef012345'
    }, (err, user) => {
      if (err) return done(err);
      getAccessToken(user, (tokenErr, token) => {
        if (tokenErr) return done(tokenErr);
        this.user = user;
        this.token = token;
        done();
      });
    });
  });
  afterEach(function () {
    clearCollections(['users']);
  });
  it('should login a user', function (done) {
    client('post', 'users/login', {
      username: this.user.username,
      password: 'test'
    }, 200, (err, res) => {
      if (err) return done(err);
      assert.equal(res.body.message, 'Login Succeeded!');
      assert(Types.ObjectId.isValid(res.body.data.id));
      assert.equal(res.body.data.username, 'test');
      assert.equal(res.body.data.email, 'test@test.com');
      getAccessToken(this.user, (tokenErr, token) => {
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
      assert(Types.ObjectId.isValid(res.body.data.id));
      assert.match(res.body.data.username, /test/);
      assert.match(res.body.data.email, /test@test.com/);
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
      client('post', 'users/register', factory.create('User'), 201, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User created.');
        assert(Types.ObjectId.isValid(res.body.data.id));
        assert.match(res.body.data.username, /User \d+/);
        assert.match(res.body.data.email, /user\d+@test.com/);
        done();
      });
    });
    it('should not register a duplicate username', function (done) {
      client('post', 'users/register', factory.create('User', { username: 'test' }), 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User.');
        assert.equal(res.body.error.username, `username 'test' already exists.`);
        done();
      });
    });
    it('should not register a duplicate email', function (done) {
      client('post', 'users/register', factory.create('User', { email: 'test@test.com' }), 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User.');
        assert.equal(res.body.error.email, `email 'test@test.com' already exists.`);
        done();
      });
    });
    it('should not register an invalid email', function (done) {
      client('post', 'users/register', factory.create('User', { email: 'test' }), 400, (err, res) => {
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
        username: 'newUser'
      }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User updated.');
        assert.equal(res.body.data.username, 'newUser');
        done();
      });
    });
    it('should update email', function (done) {
      client('put', `users/${this.user.id}?token=${this.token}`, {
        email: 'newUser@test.com'
      }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User updated.');
        assert.equal(res.body.data.email, 'newUser@test.com');
        done();
      });
    });
    it('should update password (and invalidate any outstanding access tokens)', function (done) {
      client('put', `users/${this.user.id}?token=${this.token}`, {
        password: 'newPassword'
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
});
