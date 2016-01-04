import _ from 'lodash';
import async from 'async';
import { Types } from 'mongoose';
import { assert, factory } from 'chai';
import { AccountGroup, Account, Transaction } from '../src/db';
import { clearCollections, client, getAccessToken, insertFactoryModel } from './helpers';

describe('Accounts', function () {
  beforeEach(function (done) {
    async.waterfall([
      function createUser(next) {
        insertFactoryModel('User', {}, (err, user) => {
          if (err) return next(err);
          getAccessToken(user, (tokenErr, token) => {
            if (tokenErr) return next(tokenErr);
            user.token = token;
            next(null, user);
          });
        });
      },
      function createAccountGroup(user, next) {
        insertFactoryModel('AccountGroup', { user: user.id }, (err, accountGroup) => {
          if (err) return next(err);
          next(null, user, accountGroup);
        });
      },
      function createAccounts(user, accountGroup, next) {
        async.times(5,
          (n, callback) => {
            insertFactoryModel('Account', {
              user: user.id,
              accountGroup: accountGroup.id
            }, (err, account) => {
              if (err) return callback(err);
              callback(null, account);
            });
          }, (err, accounts) => {
            if (err) return next(err);
            next(null, user, accountGroup, accounts);
          });
      },
      function createTransactions(user, accountGroup, accounts, next) {
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
            next(null, user, accountGroup, accounts, transactions);
          });
      }
    ], (err, user, accountGroup, accounts, transactions) => {
      this.user = user;
      this.accountGroup = accountGroup;
      this.accounts = _.sortBy(accounts, 'id');
      this.transactions = _.sortBy(transactions, 'id');
      this.accounts.forEach(account => {
        const accountTransactions = this.transactions.filter(transaction => transaction.account === account.id);
        account.transactions = _.pluck(accountTransactions, 'id');
        account.balance = _.sum(accountTransactions, 'amount');
      });
      this.account = _.sample(this.accounts);
      done();
    });
  });
  afterEach(function () {
    clearCollections(['users', 'accountgroups', 'accounts']);
  });
  describe('Create', function () {
    it('should create an account', function (done) {
      const newAccount = factory.create('Account', {
        accountGroup: this.accountGroup.id,
        transactions: []
      });
      client('post', `accounts?token=${this.user.token}`, newAccount, 201, (err, res) => {
        if (err) return done(err);
        assert.isUndefined(res.body.data._id);
        assert(Types.ObjectId.isValid(res.body.data.id));
        assert(Types.ObjectId.isValid(res.body.data.user));
        assert(Types.ObjectId.isValid(res.body.data.accountGroup));
        assert.deepEqual(_.omit(res.body.data, 'id'), _.merge(newAccount, {
          user: this.user.id
        }));
        done();
      });
    });
    it('should create reference in parent accountGroup', function (done) {
      const newAccount = factory.create('Account', {
        accountGroup: this.accountGroup.id,
        transactions: []
      });
      client('post', `accounts?token=${this.user.token}`, newAccount, 201, (err, res) => {
        if (err) return done(err);
        assert(res.body.data.accountGroup);
        AccountGroup.findById(res.body.data.accountGroup, (dbErr, accountGroup) => {
          if (dbErr) return done(dbErr);
          assert.include(accountGroup.accounts, res.body.data.id);
          done();
        });
      });
    });
    it('should not create an invalid account', function (done) {
      client('post', `accounts?token=${this.user.token}`, {
        accountType: 'invalid'
      }, 400, (err, res) => {
        if (err) return done(err);
        assert.equal(res.body.message, 'Error! Unable to create Account.');
        assert.equal(res.body.error.accountGroup, 'Path `accountGroup` is required.');
        assert.equal(res.body.error.budget, 'Path `budget` is required.');
        assert.equal(res.body.error.accountType, '`invalid` is not a valid enum value for path `accountType`.');
        assert.equal(res.body.error.name, 'Path `name` is required.');
        done();
      });
    });
  });
  describe('Read', function () {
    it('should return a single account', function (done) {
      client('get', `accounts/${this.account.id}?token=${this.user.token}`, {}, 200, (err, res) => {
        if (err) return done(err);
        const account = _.merge(this.account, {
          user: this.account.user.toString(),
          accountGroup: this.account.accountGroup.toString()
        });
        res.body.data.transactions.sort();
        assert.deepEqual(res.body.data, account);
        done();
      });
    });
    it('should include transactions', function (done) {
      // const testTransactions = this.account.transactions;
      client('get', `accounts/${this.account.id}?include=transactions&token=${this.user.token}`, {}, 200, (err, res) => {
        if (err) return done(err);
        const account = _.merge(this.account, {
          user: this.account.user.toString(),
          accountGroup: this.account.accountGroup.toString(),
          transactions: _.map(this.account.transactions, transactionId => _.find(this.transactions, 'id', transactionId))
        });
        // assert.deepEqual(_.omit(res.body.data, 'transactions'), _.omit(account, 'transactions'));
        // assert.deepEqual(_.sortBy(res.body.data.transactions, 'id'), _.sortBy(testTransactions, 'id'));
        res.body.data.transactions = _.sortBy(res.body.data.transactions, 'id');
        assert.deepEqual(res.body.data, account);
        done();
      });
    });
    it('should return all accounts', function (done) {
      client('get', `accounts?token=${this.user.token}`, {}, 200, (err, res) => {
        if (err) return done(err);
        const accounts = this.accounts.map((account) => {
          return _.merge(account, {
            user: account.user.toString(),
            accountGroup: account.accountGroup.toString()
          });
        });
        res.body.data.forEach(account => account.transactions.sort());
        assert.deepEqual(_.sortBy(res.body.data, 'id'), accounts);
        done();
      });
    });
    it('should be able to query a field', function (done) {
      client('get', `accounts?accountType=${this.account.accountType}&token=${this.user.token}`, {}, 200, (err, res) => {
        if (err) return done(err);
        const accounts = this.accounts.map((account) => {
          return _.merge(account, {
            user: account.user.toString(),
            accountGroup: account.accountGroup.toString()
          });
        }).filter(account => account.accountType === this.account.accountType);
        assert.equal(res.body.data.length, accounts.length);
        res.body.data.forEach(account => account.transactions.sort());
        assert.deepEqual(_.sortBy(res.body.data, 'id'), accounts);
        done();
      });
    });
  });
  describe('Update', function () {
    beforeEach(function () {
      delete this.account.balance; // remove balance so it doesn't get tested against..
    });
    it('should update an account', function (done) {
      const updatedProperties = {
        name: 'New Account Name',
        accountType: 'savings'
      };
      client('put', `accounts/${this.account.id}?token=${this.user.token}`, updatedProperties, 200, (err, res) => {
        if (err) return done(err);
        res.body.data.transactions.sort();
        assert.deepEqual(res.body.data, _.merge(this.account, updatedProperties));
        done();
      });
    });
    it('should not update readonly attributes', function (done) {
      const updatedProperties = {
        transactions: [],
        user: new Types.ObjectId() // May be temporary, but for now don't allow.
      };
      client('put', `accounts/${this.account.id}?token=${this.user.token}`, updatedProperties, 200, (err, res) => {
        if (err) return done(err);
        res.body.data.transactions.sort();
        assert.deepEqual(res.body.data, this.account);
        done();
      });
    });
  });
  describe('Delete', function () {
    beforeEach(function () {
      delete this.account.balance; // remove balance so it doesn't get tested against..
    });
    it('should delete an account', function (done) {
      client('delete', `accounts/${this.account.id}?token=${this.user.token}`, {}, 200, (err, res) => {
        if (err) return done(err);
        res.body.data.transactions.sort();
        assert.deepEqual(res.body.data, this.account);
        Account.findById(this.account.id, (dbErr, account) => {
          if (dbErr) return done(dbErr);
          assert.isNull(account);
          done();
        });
      });
    });
    it('should delete all transactions in account', function (done) {
      client('delete', `accounts/${this.account.id}?token=${this.user.token}`, {}, 200, (err, res) => {
        if (err) return done(err);
        res.body.data.transactions.sort();
        assert.deepEqual(res.body.data, this.account);
        Transaction.find({ _id: { $in: this.account.transactions } }, (dbErr, transactions) => {
          if (dbErr) return done(dbErr);
          assert.equal(transactions.length, 0, transactions);
          done();
        });
      });
    });
  });
});
