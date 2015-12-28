import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';
import Account from './account';

const transactionSchema = new Schema({
  date: { type: Date, default: new Date() },
  cleared: { type: Boolean, default: false },
  payee: { type: String, required: true },
  memo: { type: String, default: '' },
  amount: { type: Number, required: true },
  tags: [{ type: String }],
  user: { type: Schema.Types.ObjectId, $ref: 'User', required: true },
  account: { type: Schema.Types.ObjectId, $ref: 'Account', required: true }
}, {
  toJSON: {
    getters: true,
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
    }
  }
});

transactionSchema.pre('save', function addTransactionIdToAccount(next) {
  const transaction = this;
  Account.findById(transaction.account, (err, account) => {
    account.transactions.push(transaction.id);
    account.save();
    next();
  });
});

transactionSchema.post('remove', function removeTransactionIdFromAccount(transaction) {
  Account.findById(transaction.account, (err, account) => {
    if (!account) return;
    const index = account.transactions.indexOf(transaction.id);
    account.transactions.splice(index, 1);
    account.save();
  });
});

const Transaction = mongoose.model('Transaction', transactionSchema);

Transaction.schema.path('account').validate((value, next) => {
  Account.findById(value, (err, account) => {
    if (!account) {
      return next(false);
    }
    return next(true);
  });
}, 'Account does not exist.');

export default Transaction;
