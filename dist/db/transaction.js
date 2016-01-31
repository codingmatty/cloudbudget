'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _ = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var transactionSchema = new _mongoose.Schema({
  date: { type: Date, default: Date.now },
  state: { type: String, enum: ['unapproved', 'pending', 'cleared', 'reconciled'], required: true },
  payee: { type: String, required: true, minlength: 1 },
  amount: { type: Number, required: true },
  memo: { type: String, default: '' },
  tags: [{ type: String }],
  user: { type: _mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: _mongoose.Schema.Types.ObjectId, ref: 'Account', required: true }
}, {
  toJSON: (0, _.defaultJSONOptions)(function (doc, ret) {
    ret.account = ret.account instanceof _mongoose.Types.ObjectId ? ret.account.toString() : ret.account;
    ret.date = ret.date.toString();
  })
});

transactionSchema.static('readonlyProps', function () {
  return ['user'];
});

transactionSchema.path('account').validate(function validateAccount(value, next) {
  var transaction = this;
  _.Account.findOne({ _id: value, user: transaction.user }, function (err, account) {
    if (!account) {
      return next(false, 'Account does not exist.');
    }
    return next(true);
  });
});

var Transaction = _mongoose2.default.model('Transaction', transactionSchema);

Transaction.schema.pre('save', function normalizeTransaction(next) {
  var transaction = this;
  transaction.date = (0, _moment2.default)(new Date(transaction.date).toISOString()).utc().startOf('day');
  next();
});

exports.default = Transaction;