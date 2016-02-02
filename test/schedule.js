import _ from 'lodash';
import async from 'async';
import moment from 'moment';
import { Types } from 'mongoose';
import { assert, factory } from 'chai';
import { clearCollections, httpClient, getJwtToken, insertFactoryModel } from './helpers';
import { Schedule, Transaction } from '../src/db';

describe('Schedules', function () {
  beforeEach(function (done) {
    async.waterfall([
      function createUser(next) {
        insertFactoryModel('User', {}, (err, user) => {
          if (err) return next(err);
          getJwtToken(user, (tokenErr, token) => {
            if (tokenErr) return next(tokenErr);
            user.token = token;
            next(null, user);
          });
        });
      },
      function createAccount(user, next) {
        insertFactoryModel('Account', {
          user: user.id
        }, (err, account) => {
          if (err) return next(err);
          next(null, user, account);
        });
      },
      function createSchedule(user, account, next) {
        async.times(10,
          (n, callback) => {
            insertFactoryModel('Schedule', {
              user: user.id,
              transaction: {
                user: user.id,
                account: account.id
              }
            }, (err, schedule) => {
              if (err) return callback(err);
              callback(null, schedule);
            });
          }, (err, schedules) => {
            if (err) return next(err);
            next(null, user, account, schedules);
          });
      }
    ], (err, user, account, schedules) => {
      this.user = user;
      this.account = account;
      this.schedules = _.sortBy(schedules, 'id');
      this.schedule = _.sample(this.schedules);
      done();
    });
  });
  afterEach(function () {
    clearCollections(['users', 'accounts', 'transactions', 'schedules']);
  });
  describe('Create', function () {
    beforeEach(function () {
      this.newSchedule = factory.create('Schedule', {
        transaction: {
          account: this.account.id
        }
      });
    });
    it('should create a schedule', function (done) {
      httpClient('post', `schedules`, { jwtToken: this.user.token, body: this.newSchedule }, 201, (err, res) => {
        if (err) return done(err);
        assert.isUndefined(res.body.data._id);
        assert(Types.ObjectId.isValid(res.body.data.id));
        assert(Types.ObjectId.isValid(res.body.data.user));
        assert(Types.ObjectId.isValid(res.body.data.transaction.user));
        assert(Types.ObjectId.isValid(res.body.data.transaction.account));
        assert.deepEqual(_.omit(res.body.data, 'id'), _.merge(this.newSchedule, {
          user: this.user.id,
          transaction: {
            user: this.user.id,
            date: this.newSchedule.transaction.date.local().toDate().toString()
          }
        }));
        done();
      });
    });
    it('should not create an invalid schedule', function (done) {
      httpClient('post', `schedules`, {
        jwtToken: this.user.token,
        body: {
          frequency: 'invalid',
          transaction: {
            date: moment().add(1, 'd').toString()
          }
        }
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create Schedule.');
        assert.equal(res.body.errors.frequency, '`invalid` is not a valid enum value for path `frequency`.');
        assert.equal(res.body.errors.transaction.account, 'Path `account` is required.');
        assert.equal(res.body.errors.transaction.amount, 'Path `amount` is required.');
        assert.equal(res.body.errors.transaction.payee, 'Path `payee` is required.');
        assert.equal(res.body.errors.transaction.state, 'Path `state` is required.');
        done();
      });
    });
    it('should not create a schedule with a transaction date today or earlier', function (done) {
      httpClient('post', `schedules`, {
        jwtToken: this.user.token,
        body: {
          frequency: 'custom',
          transaction: {
            date: moment().toString()
          }
        }
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create Schedule.');
        assert.equal(res.body.errors.transaction, 'Transaction date must be later than today.');
        done();
      });
    });
  });
  describe('Read', function () {
    it('should return a single schedule', function (done) {
      httpClient('get', `schedules/${this.schedule.id}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.schedule);
        done();
      });
    });
    it('should include references', function (done) {
      httpClient('get', `schedules/${this.schedule.id}?include=transaction.account`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        const schedule = _.merge(this.schedule, {
          transaction: {
            account: this.account
          }
        });
        assert.deepEqual(res.body.data, schedule);
        done();
      });
    });
    it('should return all schedules', function (done) {
      httpClient('get', `schedules`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), this.schedules);
        done();
      });
    });
    it('should be able to query a field', function (done) {
      httpClient('get', `schedules?transaction.payee=${this.schedule.transaction.payee}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.data.length, 1);
        assert.deepEqual(res.body.data, [this.schedule]);
        done();
      });
    });
  });
  describe('Update', function () {
    it('should update an schedule', function (done) {
      const updatedProperties = {
        frequency: 'daily',
        transaction: {
          payee: 'New Transaction Payee'
        }
      };
      httpClient('put', `schedules/${this.schedule.id}`, { jwtToken: this.user.token, body: updatedProperties }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, _.merge(this.schedule, updatedProperties));
        done();
      });
    });
    it('should not update readonly attributes', function (done) {
      const updatedProperties = {
        user: new Types.ObjectId(), // May be temporary, but for now don't allow.
        transaction: {
          user: new Types.ObjectId()
        }
      };
      httpClient('put', `schedules/${this.schedule.id}`, { jwtToken: this.user.token, body: updatedProperties }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.schedule);
        done();
      });
    });
  });
  describe('Delete', function () {
    it('should delete an schedule', function (done) {
      httpClient('delete', `schedules/${this.schedule.id}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.schedule);
        Schedule.findById(this.schedule.id, (dbErr, schedule) => {
          if (dbErr) return done(dbErr);
          assert.isNull(schedule);
          done();
        });
      });
    });
  });
  describe('Submit', function () {
    beforeEach(function (done) {
      Schedule.findOne({ _id: this.schedule.id }, (err, schedule) => {
        if (err) return done(err);
        this.dbSchedule = schedule;
        schedule.frequency = 'weekly';
        schedule.save(done);
      });
    });
    it('should create a transaction from the sub-transaction', function (done) {
      this.dbSchedule.submitTransaction((err) => {
        if (err) return done(err);
        Transaction.findOne({ payee: this.schedule.transaction.payee }, (findErr, transaction) => {
          if (findErr) return done(findErr);
          assert(Types.ObjectId.isValid(transaction.id));
          assert.deepEqual(_.omit(transaction.toJSON(), 'id'), this.schedule.transaction);
          done();
        });
      });
    });
    it('should update the date on the scheduled transaction', function (done) {
      this.dbSchedule.submitTransaction((err) => {
        if (err) return done(err);
        Schedule.findOne({ _id: this.dbSchedule.id }, (findErr, schedule) => {
          if (findErr) return done(findErr);
          const expectedNewDate = moment(new Date(this.schedule.transaction.date)).add(1, 'w').toString();
          const actualNewDate = moment(new Date(schedule.transaction.date)).toString();
          assert.equal(actualNewDate, expectedNewDate);
          done();
        });
      });
    });
  });
});
