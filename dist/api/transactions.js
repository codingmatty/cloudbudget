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

api.put('/', function (req, res) {
  var query = (0, _index.buildQuery)(_db.Transaction, req);
  query.user = req.user.id;
  _db.Transaction.find(query, function (findErr, transactions) {
    if (findErr) {
      return (0, _index.handleError)(findErr, res, 'update', 'Transactions');
    }
    var updatedTransactions = transactions.map(function (transaction) {
      return _lodash2.default.merge(transaction, _lodash2.default.omit(req.body, _db.Transaction.readonlyProps() || []));
    });
    _async2.default.map(updatedTransactions, function (transaction, callback) {
      transaction.save(callback);
    }, function (saveErr, dbTransactions) {
      if (saveErr) {
        return (0, _index.handleError)(saveErr, res, 'delete', 'Transactions');
      }
      res.status(200).send({
        message: 'Success! Transactions updated.',
        data: dbTransactions
      });
    });
  });
});

api.delete('/', function (req, res) {
  var query = (0, _index.buildQuery)(_db.Transaction, req);
  query.user = req.user.id;
  _db.Transaction.find(query, function (findErr, transactions) {
    if (findErr) {
      return (0, _index.handleError)(findErr, res, 'delete', 'Transactions');
    }
    _async2.default.map(transactions, function (transaction, callback) {
      transaction.remove(callback);
    }, function (removeErr, deletedTransactions) {
      if (removeErr) {
        return (0, _index.handleError)(removeErr, res, 'delete', 'Transactions');
      }
      res.status(200).send({
        message: 'Success! Transactions deleted.',
        data: deletedTransactions
      });
    });
  });
});

api.use('/', (0, _resource2.default)('Transaction', true));

exports.default = api;