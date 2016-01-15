'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _ = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var transactionSchema = new _mongoose.Schema({
  date: { type: Date, default: Date.now },
  state: { type: String, enum: ['none', 'cleared', 'reconciled'], required: true },
  payee: { type: String, required: true },
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
  return ['user', 'account'];
});

transactionSchema.pre('save', function addTransactionIdToAccount(next) {
  var transaction = this;
  _.Account.findById(transaction.account, function (err, account) {
    if (err) return next(err);
    account.transactions.push(transaction.id);
    account.save(next);
  });
});

transactionSchema.post('remove', function (transaction, next) {
  _.Account.findById(transaction.account, function (err, account) {
    if (!account) return next();
    var index = account.transactions.indexOf(transaction.id);
    account.transactions.splice(index, 1);
    account.save(next);
  });
});

transactionSchema.path('account').validate(function validateTransactionAccount(value, next) {
  var transaction = this;
  _.Account.findOne({ _id: value, user: transaction.user }, function (err, account) {
    if (!account) {
      return next(false, 'Account does not exist.');
    }
    return next(true);
  });
});

var Transaction = _mongoose2.default.model('Transaction', transactionSchema);
exports.default = Transaction;