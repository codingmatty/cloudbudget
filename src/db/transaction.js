import moment from 'moment';
import mongoose, { Schema, Types } from 'mongoose';
import { defaultJSONOptions, Account } from './';

const transactionSchema = new Schema({
  date: { type: Date, default: Date.now },
  state: { type: String, enum: ['none', 'cleared', 'reconciled'], required: true },
  payee: { type: String, required: true, minlength: 1 },
  amount: { type: Number, required: true },
  memo: { type: String, default: '' },
  tags: [{ type: String }],
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true }
}, {
  toJSON: defaultJSONOptions((doc, ret) => {
    ret.account = ret.account instanceof Types.ObjectId ? ret.account.toString() : ret.account;
    ret.date = ret.date.toString();
  })
});

transactionSchema.static('readonlyProps', () => {
  return ['user'];
});

transactionSchema.path('account').validate(function validateAccount(value, next) {
  const transaction = this;
  Account.findOne({ _id: value, user: transaction.user }, (err, account) => {
    if (!account) {
      return next(false, 'Account does not exist.');
    }
    return next(true);
  });
});

const Transaction = mongoose.model('Transaction', transactionSchema);

Transaction.schema.pre('save', function normalizeTransaction(next) {
  const transaction = this;
  transaction.date = moment(new Date(transaction.date).toISOString()).utc().startOf('day');
  next();
});

export default Transaction;
