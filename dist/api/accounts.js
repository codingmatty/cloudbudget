'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _express = require('express');

var _resource = require('./resource');

var _resource2 = _interopRequireDefault(_resource);

var _index = require('./index');

var _db = require('../db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api = new _express.Router();
api.use(_passport2.default.authenticate(['jwt', 'bearer'], { session: false }));

// GET - List (with Balance)
(0, _resource.listMethod)(api, 'Account', true, function (req, res, accounts) {
  _async2.default.map(accounts, function (account, callback) {
    account.getBalance(function (err, balance) {
      var normalizedAccount = account.toJSON();
      normalizedAccount.balance = balance;
      callback(null, normalizedAccount);
    });
  }, function (err, normalizedAccounts) {
    res.status(200).send({ data: normalizedAccounts });
  });
});

// GET - Show (with Balance)
(0, _resource.showMethod)(api, 'Account', true, function (req, res, account) {
  account.getBalance(function (err, balance) {
    var normalizedAccount = account.toJSON();
    normalizedAccount.balance = balance;
    res.status(200).send({ data: normalizedAccount });
  });
});

// Update Multiple
api.put('/', function (req, res) {
  var query = (0, _index.buildQuery)(_db.Account, req);
  query.user = req.user.id;
  _db.Account.find(query, function (findErr, accounts) {
    if (findErr) {
      return (0, _index.handleError)(findErr, res, 'update', 'Accounts');
    }
    var updatedAccounts = accounts.map(function (transaction) {
      return _lodash2.default.merge(transaction, _lodash2.default.omit(req.body, _db.Account.readonlyProps() || []));
    });
    _async2.default.map(updatedAccounts, function (transaction, callback) {
      transaction.save(callback);
    }, function (saveErr, dbAccounts) {
      if (saveErr) {
        return (0, _index.handleError)(saveErr, res, 'delete', 'Accounts');
      }
      res.status(200).send({
        message: 'Success! Accounts updated.',
        data: dbAccounts
      });
    });
  });
});

api.use('/', (0, _resource2.default)('Account', true, ['create', 'update', 'delete']));

exports.default = api;