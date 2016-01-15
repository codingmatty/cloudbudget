'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _2 = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var accountSchema = new _mongoose.Schema({
  name: { type: String, required: true },
  group: { type: String, required: true },
  type: { type: String, enum: ['savings', 'checking', 'credit_card', 'loan', 'investment'], required: true },
  budget: { type: Boolean, required: true },
  notes: String,
  user: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactions: [{ type: _mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
}, {
  toJSON: (0, _2.defaultJSONOptions)(function (doc, ret) {
    ret.transactions = ret.transactions.map(function (transaction) {
      return transaction instanceof _mongoose.Types.ObjectId ? transaction.toString() : transaction;
    });
  })
});

accountSchema.static('readonlyProps', function () {
  return ['transactions', 'user'];
});

accountSchema.methods.getBalance = function getBalance(done) {
  var account = this;
  _2.Transaction.find({ account: account.id }, function (err, transactions) {
    if (err) return done(err);
    done(null, _lodash2.default.sum(transactions, 'amount'));
  });
};

var Account = _mongoose2.default.model('Account', accountSchema);

Account.schema.post('remove', function (account, next) {
  // Remove all transactions that are apart of this account
  _2.Transaction.find({ account: account.id }, function (err, transactions) {
    if (err) return next(err);
    _async2.default.each(transactions, function (transaction, done) {
      transaction.remove(done);
    }, next);
  });
});

exports.default = Account;