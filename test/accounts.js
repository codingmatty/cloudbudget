import _ from 'lodash';
import async from 'async';
import { Types } from 'mongoose';
import { assert, factory } from 'chai';
import { clearCollections, httpClient, getJwtToken, insertFactoryModel } from './helpers';
import { Account, Transaction } from '../src/db';

describe('Accounts', function () {
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
      function createAccounts(user, next) {
        async.times(5,
          (n, callback) => {
            insertFactoryModel('Account', {
              user: user.id
            }, (err, account) => {
              if (err) return callback(err);
              callback(null, account);
            });
          }, (err, accounts) => {
            if (err) return next(err);
            next(null, user, accounts);
          });
      },
      function createTransactions(user, accounts, next) {
        async.times(10,
          (n, callback) => {
            insertFactoryModel('Transaction', {
              user: user.id,
              account: _.sample(accounts).id
            }, (err, transaction) => {
              if (err) return callback(err);
              callback(null, transaction);
            });
          }, (err, transactions) => {
            if (err) return next(err);
            next(null, user, accounts, transactions);
          });
      }
    ], (err, user, accounts, transactions) => {
      this.user = user;
      this.accounts = _.sortBy(accounts, 'id');
      this.transactions = _.sortBy(transactions, 'id');
      this.accounts.forEach(account => {
        const accountTransactions = this.transactions.filter(transaction => transaction.account === account.id);
        account.balance = _.sumBy(accountTransactions, 'amount');
      });
      this.account = _.sample(this.accounts);
      done();
    });
  });
  afterEach(function () {
    clearCollections(['users', 'accounts', 'transactions']);
  });
  describe('Create', function () {
    it('should create an account', function (done) {
      const newAccount = factory.create('Account');
      httpClient('post', `accounts`, { jwtToken: this.user.token, body: newAccount }, 201, (err, res) => {
        if (err) return done(err);
        assert.isUndefined(res.body.data._id);
        assert(Types.ObjectId.isValid(res.body.data.id));
        assert(Types.ObjectId.isValid(res.body.data.user));
        assert.deepEqual(_.omit(res.body.data, 'id'), _.merge(newAccount, {
          balance: 0,
          user: this.user.id
        }));
        done();
      });
    });
    it('should not create an invalid account', function (done) {
      httpClient('post', `accounts`, {
        jwtToken: this.user.token,
        body: {
          type: 'invalid'
        }
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create Account.');
        assert.equal(res.body.errors.budget, 'Path `budget` is required.');
        assert.equal(res.body.errors.type, '`invalid` is not a valid enum value for path `type`.');
        assert.equal(res.body.errors.name, 'Path `name` is required.');
        done();
      });
    });
  });
  describe('Read', function () {
    it('should return a single account', function (done) {
      httpClient('get', `accounts/${this.account.id}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.account);
        done();
      });
    });
    it('should include references', function (done) {
      httpClient('get', `accounts/${this.account.id}?include=user`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        const account = _.merge(this.account, {
          user: _.omit(this.user, 'token')
        });
        assert.deepEqual(res.body.data, account);
        done();
      });
    });
    it('should return all accounts', function (done) {
      httpClient('get', `accounts`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), this.accounts);
        done();
      });
    });
    it('should be able to query a field', function (done) {
      httpClient('get', `accounts?type=${this.account.type}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        const accounts = this.accounts.filter(account => account.type === this.account.type);
        assert.equal(res.body.data.length, accounts.length);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), accounts);
        done();
      });
    });
  });
  describe('Update', function () {
    it('should update an account', function (done) {
      const updatedProperties = {
        name: 'New Account Name',
        type: 'savings'
      };
      httpClient('put', `accounts/${this.account.id}`, { jwtToken: this.user.token, body: updatedProperties }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, _.merge(this.account, updatedProperties));
        done();
      });
    });
    it('should not update readonly attributes', function (done) {
      const updatedProperties = {
        balance: 100,
        user: new Types.ObjectId() // May be temporary, but for now don't allow.
      };
      httpClient('put', `accounts/${this.account.id}`, { jwtToken: this.user.token, body: updatedProperties }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.account);
        done();
      });
    });
    it('should update multiple accounts', function (done) {
      const updatedProperties = {
        group: 'New Group'
      };
      const selectAccounts = _.sortBy(_.sampleSize(this.accounts, 3), 'id');
      httpClient('put', `accounts/?id=[${_.map(selectAccounts, 'id') }]`, { jwtToken: this.user.token, body: updatedProperties }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), selectAccounts.map(account => _.merge(account, updatedProperties)));
        done();
      });
    });
  });
  describe('Delete', function () {
    it('should delete an account', function (done) {
      httpClient('delete', `accounts/${this.account.id}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.account);
        Account.findById(this.account.id, (dbErr, account) => {
          if (dbErr) return done(dbErr);
          assert.isNull(account);
          done();
        });
      });
    });
    it('should delete all transactions in account', function (done) {
      httpClient('delete', `accounts/${this.account.id}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.account);
        Transaction.find({ account: this.account.id }, (dbErr, transactions) => {
          if (dbErr) return done(dbErr);
          assert.equal(transactions.length, 0, transactions);
          done();
        });
      });
    });
  });
});
