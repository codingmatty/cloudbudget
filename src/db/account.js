import _ from 'lodash';
import async from 'async';
import mongoose, { Schema, Types } from 'mongoose';
import { defaultJSONOptions, Transaction } from './';

const accountSchema = new Schema({
  name: { type: String, required: true },
  group: { type: String, required: true },
  type: { type: String, enum: ['savings', 'checking', 'credit_card', 'loan', 'investment'], required: true },
  budget: { type: Boolean, required: true },
  notes: String,
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }]
}, {
  toJSON: defaultJSONOptions((doc, ret) => {
    ret.transactions = ret.transactions.map(transaction => transaction instanceof Types.ObjectId ? transaction.toString() : transaction);
  })
});

accountSchema.static('readonlyProps', () => {
  return ['transactions', 'user'];
});

accountSchema.methods.getBalance = function getBalance(done) {
  const account = this;
  Transaction.find({ account: account.id }, (err, transactions) => {
    if (err) return done(err);
    done(null, _.sum(transactions, 'amount'));
  });
};

const Account = mongoose.model('Account', accountSchema);

Account.schema.post('remove', (account, next) => {
  // Remove all transactions that are apart of this account
  Transaction.find({ account: account.id }, (err, transactions) => {
    if (err) return next(err);
    async.each(transactions, (transaction, done) => {
      transaction.remove(done);
    }, next);
  });
});

export default Account;
