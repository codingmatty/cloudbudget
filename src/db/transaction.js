import mongoose, { Schema, Types } from 'mongoose';
import { defaultJSONOptions, Account } from './';

const transactionSchema = new Schema({
  date: { type: Date, default: new Date() },
  state: { type: String, enum: ['none', 'cleared', 'reconciled'], required: true },
  payee: { type: String, required: true },
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
  return ['user', 'account'];
});

transactionSchema.pre('save', function addTransactionIdToAccount(next) {
  const transaction = this;
  Account.findById(transaction.account, (err, account) => {
    if (err) return next(err);
    account.transactions.push(transaction.id);
    account.save(next);
  });
});

transactionSchema.post('remove', function removeTransactionIdFromAccount(transaction, next) {
  Account.findById(transaction.account, (err, account) => {
    if (!account) return next();
    const index = account.transactions.indexOf(transaction.id);
    account.transactions.splice(index, 1);
    account.save(next);
  });
});

transactionSchema.path('account').validate(function validateTransactionAccount(value, next) {
  const transaction = this;
  Account.findOne({ _id: value, user: transaction.user }, (err, account) => {
    if (!account) {
      return next(false, 'Account does not exist.');
    }
    return next(true);
  });
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
