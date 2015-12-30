import 'source-map-support/register';
import request from 'supertest';
import app from '../src/app';
import assert from 'assert';
import db, * as dbModels from '../src/db';
import bcrypt from 'bcrypt';

describe('Root', function () {
  let server;
  before(function (done) {
    const waitForDb = setInterval(() => {
      if (db.connection.readyState === 1) {
        clearInterval(waitForDb);
        const collections = db.connection.collections;
        for (const key in collections) {
          if (collections.hasOwnProperty(key)) {
            collections[key].remove({});
          }
        }
        server = app.listen(8080);
        return done();
      }
    }, 500);
  });
  after(function () {
    db.disconnect();
    server.close();
  });
  describe('Users', function () {
    before(function (done) {
      dbModels.User.create({ username: 'test', password: bcrypt.hashSync('test', 8), email: 'test@test.com' }, (err) => {
        done(err);
      });
    });
    it('should login', function (done) {
      request(server)
        .post('/api/v1/users/login')
        .send({ username: 'test', password: 'test' })
        .expect(200)
        .end((err, res) => {
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
        request(server)
          .post('/api/v1/users/register')
          .send({ username: 'newUser1', password: 'test', email: 'newUser1@test.com' })
          .expect(201)
          .end((err, res) => {
            if (err) return done(err);
            assert.equal(res.body.message, 'Success! User created');
            assert(res.body.data.id);
            assert.equal(res.body.data.username, 'newUser1');
            assert.equal(res.body.data.email, 'newUser1@test.com');
            done();
          });
      });
      it('should not register a duplicate username', function (done) {
        request(server)
          .post('/api/v1/users/register')
          .send({ username: 'test', password: 'test', email: 'newUser2@test.com' })
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            assert.equal(res.body.message, 'Error! Unable to create User');
            assert.equal(res.body.error.username, `username 'test' already exists.`);
            done();
          });
      });
      it('should not register a duplicate email', function (done) {
        request(server)
          .post('/api/v1/users/register')
          .send({ username: 'newUser3', password: 'test', email: 'test@test.com' })
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            assert.equal(res.body.message, 'Error! Unable to create User');
            assert.equal(res.body.error.email, `email 'test@test.com' already exists.`);
            done();
          });
      });
      it('should not register an invalid email', function (done) {
        request(server)
          .post('/api/v1/users/register')
          .send({ username: 'newUser4', password: 'test', email: 'test' })
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);
            assert.equal(res.body.message, 'Error! Unable to create User');
            assert.equal(res.body.error.email, 'test is not a valid email address.');
            done();
          });
      });
    });

  });
});
