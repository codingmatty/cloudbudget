import { client } from './helpers';
import assert from 'assert';
import db, * as dbModels from '../src/db';
import bcrypt from 'bcrypt';

describe('Users', function () {
  before(function (done) {
    dbModels.User.create({ username: 'test', password: bcrypt.hashSync('test', 8), email: 'test@test.com' }, (err) => {
      done(err);
    });
  });
  afterEach(function () {
    db.connection.db.collection('sessions').remove({});
  });
  it('should login', function (done) {
    client('post', 'users/login', {
      username: 'test', password: 'test'
    }, 200, (err, res) => {
      if (err) return done(err);
      assert.equal(res.body.message, 'Login Succeeded!');
      assert(res.body.data.id);
      assert.equal(res.body.data.username, 'test');
      assert.equal(res.body.data.email, 'test@test.com');
      done();
    });
  });
  describe('Register', function () {
    it('should register a user', function registerUser(done) {
      client('post', 'users/register', {
        username: 'newUser1', password: 'test', email: 'newUser1@test.com'
      }, 201, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Success! User created');
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
        assert.equal(res.body.message, 'Error! Unable to create User');
        assert.equal(res.body.error.username, `username 'test' already exists.`);
        done();
      });
    });
    it('should not register a duplicate email', function (done) {
      client('post', 'users/register', {
        username: 'newUser3', password: 'test', email: 'test@test.com'
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User');
        assert.equal(res.body.error.email, `email 'test@test.com' already exists.`);
        done();
      });
    });
    it('should not register an invalid email', function (done) {
      client('post', 'users/register', {
        username: 'newUser4', password: 'test', email: 'test'
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create User');
        assert.equal(res.body.error.email, 'test is not a valid email address.');
        done();
      });
    });
  });
});