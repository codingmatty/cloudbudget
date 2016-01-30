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
  name: { type: String, required: true, minlength: 1 },
  group: { type: String, required: true, minlength: 1 },
  type: { type: String, enum: ['savings', 'checking', 'credit_card', 'loan', 'asset', 'investment'], required: true },
  budget: { type: Boolean, required: true },
  notes: String,
  user: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  toJSON: (0, _2.defaultJSONOptions)()
});

accountSchema.static('readonlyProps', function () {
  return ['user'];
});

accountSchema.methods.normalize = function normalize(done) {
  var account = this;
  account.getBalance(function (err, balance) {
    // if (err) return done(err);
    done(_lodash2.default.merge(account.toJSON(), { balance: balance }));
  });
};

accountSchema.methods.getTransactions = function getTransactions(done) {
  var account = this;
  _2.Transaction.find({ account: account.id }, function (err, transactions) {
    if (err) return done(err);
    done(null, transactions);
  });
};

accountSchema.methods.getBalance = function getBalance(done) {
  var account = this;
  account.getTransactions(function (err, transactions) {
    if (err) return done(err);
    done(null, _lodash2.default.sum(transactions, 'amount'));
  });
};

var Account = _mongoose2.default.model('Account', accountSchema);

Account.schema.post('remove', function (account, next) {
  // Remove all transactions that are apart of this account
  account.getTransactions(function (err, transactions) {
    if (err) return next(err);
    _async2.default.each(transactions, function (transaction, done) {
      transaction.remove(done);
    }, next);
  });
});

exports.default = Account;