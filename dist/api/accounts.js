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

// Update Multiple
api.put('/', function (req, res) {
  var query = (0, _index.buildQuery)(_db.Account, req);
  query.user = req.user.id;
  _db.Account.find(query, function (findErr, accounts) {
    if (findErr) {
      return (0, _index.handleError)(findErr, res, 'update', 'Accounts');
    }
    var updatedAccounts = accounts.map(function (account) {
      return _lodash2.default.merge(account, _lodash2.default.omit(req.body, _db.Account.readonlyProps() || []));
    });
    _async2.default.map(updatedAccounts, function (account, callback) {
      account.save(callback);
    }, function (saveErr, dbAccounts) {
      if (saveErr) {
        return (0, _index.handleError)(saveErr, res, 'delete', 'Accounts');
      }
      _async2.default.map(dbAccounts, function (dbAccount, next) {
        if (dbAccount.normalize) {
          dbAccount.normalize(_lodash2.default.partial(next, null));
        } else {
          next(null, dbAccount);
        }
      }, function (normalizeErr, normalizeAccounts) {
        if (normalizeErr) {
          return (0, _index.handleError)(normalizeErr, res, 'list', _db.Account.modelName);
        }
        res.status(200).send({
          message: 'Success! Accounts updated.',
          data: normalizeAccounts
        });
      });
    });
  });
});

api.use('/', (0, _resource2.default)('Account', true, ['list', 'create', 'show', 'update', 'delete']));

exports.default = api;