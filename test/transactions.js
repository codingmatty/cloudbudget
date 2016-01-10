import _ from 'lodash';
import async from 'async';
import { Types } from 'mongoose';
import { assert, factory } from 'chai';
import { clearCollections, httpClient, getJwtToken, insertFactoryModel } from './helpers';
import { Account, Transaction } from '../src/db';

describe('Transactions', function () {
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
      function createTransactions(user, account, next) {
        async.times(10,
          (n, callback) => {
            insertFactoryModel('Transaction', {
              user: user.id,
              account: account.id
            }, (err, transaction) => {
              if (err) return callback(err);
              callback(null, transaction);
            });
          }, (err, transactions) => {
            if (err) return next(err);
            next(null, user, account, transactions);
          });
      }
    ], (err, user, account, transactions) => {
      this.user = user;
      this.transactions = _.sortBy(transactions, 'id');
      account.transactions = _.pluck(this.transactions, 'id');
      account.balance = _.sum(this.transactions, 'amount');
      this.account = account;
      this.transaction = _.sample(this.transactions);
      done();
    });
  });
  afterEach(function () {
    clearCollections(['users', 'accounts', 'transactions']);
  });
  describe('Create', function () {
    beforeEach(function () {
      this.newTransaction = factory.create('Transaction', {
        account: this.account.id
      });
    });
    it('should create a transaction', function (done) {
      httpClient('post', `transactions`, { jwtToken: this.user.token, body: this.newTransaction }, 201, (err, res) => {
        if (err) return done(err);
        assert.isUndefined(res.body.data._id);
        assert(Types.ObjectId.isValid(res.body.data.id));
        assert(Types.ObjectId.isValid(res.body.data.user));
        assert(Types.ObjectId.isValid(res.body.data.account));
        assert(!_.isNaN(Date.parse(res.body.data.date)));
        assert.deepEqual(_.omit(res.body.data, 'id', 'date'), _.merge(this.newTransaction, {
          user: this.user.id
        }));
        done();
      });
    });
    it('should create reference in parent account', function (done) {
      httpClient('post', `transactions`, { jwtToken: this.user.token, body: this.newTransaction }, 201, (err, res) => {
        if (err) return done(err);
        assert(res.body.data.account);
        Account.findById(res.body.data.account, (dbErr, account) => {
          if (dbErr) return done(dbErr);
          assert.include(account.transactions, res.body.data.id);
          done();
        });
      });
    });
    it('should not create an invalid transaction', function (done) {
      httpClient('post', `transactions`, {
        jwtToken: this.user.token,
        body: {
          date: 'invalid'
        }
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create Transaction.');
        assert.equal(res.body.error.state, 'Path `state` is required.');
        assert.equal(res.body.error.payee, 'Path `payee` is required.');
        assert.equal(res.body.error.amount, 'Path `amount` is required.');
        assert.equal(res.body.error.date, 'Cast to Date failed for value "invalid" at path "date"');
        done();
      });
    });
  });
  describe('Read', function () {
    it('should return a single transaction', function (done) {
      httpClient('get', `transactions/${this.transaction.id}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.transaction);
        done();
      });
    });
    it('should include references', function (done) {
      httpClient('get', `transactions/${this.transaction.id}?include=account`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        const account = _.omit(this.account, 'balance');
        const transaction = _.merge(this.transaction, {
          account: _.merge(account, {
            transactions: this.account.transactions
          })
        });
        res.body.data.account.transactions.sort();
        assert.deepEqual(res.body.data, transaction);
        done();
      });
    });
    it('should return all transactions', function (done) {
      httpClient('get', `transactions`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), this.transactions);
        done();
      });
    });
    it('should be able to query a field', function (done) {
      httpClient('get', `transactions?payee=${this.transaction.payee}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        const transactions = this.transactions.filter(transaction => transaction.payee === this.transaction.payee);
        assert.equal(res.body.data.length, transactions.length);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), transactions);
        done();
      });
    });
  });
  describe('Update', function () {
    it('should update an transaction', function (done) {
      const updatedProperties = {
        payee: 'New Transaction Payee',
        state: 'cleared'
      };
      httpClient('put', `transactions/${this.transaction.id}`, { jwtToken: this.user.token, body: updatedProperties }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, _.merge(this.transaction, updatedProperties));
        done();
      });
    });
    it('should not update readonly attributes', function (done) {
      const updatedProperties = {
        account: new Types.ObjectId(),
        user: new Types.ObjectId() // May be temporary, but for now don't allow.
      };
      httpClient('put', `transactions/${this.transaction.id}`, { jwtToken: this.user.token, body: updatedProperties }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.transaction);
        done();
      });
    });
    it('should update multiple transactions', function (done) {
      const updatedProperties = {
        state: 'reconciled'
      };
      const selectTransactions = _.sortBy(_.sample(this.transactions, 5), 'id');
      httpClient('put', `transactions/?id=${_.pluck(selectTransactions, 'id')}`, { jwtToken: this.user.token, body: updatedProperties }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), selectTransactions.map(transaction => _.merge(transaction, updatedProperties)));
        done();
      });
    });
  });
  describe('Delete', function () {
    it('should delete an transaction', function (done) {
      httpClient('delete', `transactions/${this.transaction.id}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(res.body.data, this.transaction);
        Transaction.findById(this.transaction.id, (dbErr, transaction) => {
          if (dbErr) return done(dbErr);
          assert.isNull(transaction);
          done();
        });
      });
    });
    it('should delete multiple transactions', function (done) {
      const selectTransactions = _.sortBy(_.sample(this.transactions, 5), 'id');
      httpClient('delete', `transactions/?id=${_.pluck(selectTransactions, 'id')}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), selectTransactions);
        Transaction.find({ _id: { $in: _.pluck(selectTransactions, 'id') } }, (dbErr, transactions) => {
          if (dbErr) return done(dbErr);
          assert.deepEqual(transactions, []);
          done();
        });
      });
    });
    it('should delete transactions from account', function (done) {
      const selectTransactions = _.sortBy(_.sample(this.transactions, 5), 'id');
      httpClient('delete', `transactions/?id=${_.pluck(selectTransactions, 'id')}`, { jwtToken: this.user.token }, 200, (err, res) => {
        if (err) return done(err);
        assert.deepEqual(_.sortBy(res.body.data, 'id'), selectTransactions);
        Account.find({ _id: { $in: _.pluck(selectTransactions, 'account') } }, (dbErr, accounts) => {
          if (dbErr) return done(dbErr);
          accounts.forEach((account) => { assert.notInclude(account.transactions, _.pluck(selectTransactions, 'id')); });
          done();
        });
      });
    });
  });
});
