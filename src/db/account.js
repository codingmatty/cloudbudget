import _ from 'lodash';
import async from 'async';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions, Transaction } from './';

const accountSchema = new Schema({
  name: { type: String, required: true, minlength: 1 },
  group: { type: String, required: true, minlength: 1 },
  type: { type: String, enum: ['savings', 'checking', 'credit_card', 'loan', 'asset', 'investment'], required: true },
  budget: { type: Boolean, required: true },
  notes: String,
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  toJSON: defaultJSONOptions()
});

accountSchema.static('readonlyProps', () => {
  return ['user'];
});

accountSchema.methods.normalize = function normalize(done) {
  const account = this;
  account.getBalance((err, balance) => {
    // if (err) return done(err);
    done(_.merge(account.toJSON(), { balance }));
  });
};

accountSchema.methods.getTransactions = function getTransactions(done) {
  const account = this;
  Transaction.find({ account: account.id }, (err, transactions) => {
    if (err) return done(err);
    done(null, transactions);
  });
};

accountSchema.methods.getBalance = function getBalance(done) {
  const account = this;
  account.getTransactions((err, transactions) => {
    if (err) return done(err);
    done(null, _.sumBy(transactions, 'amount'));
  });
};

const Account = mongoose.model('Account', accountSchema);

Account.schema.post('remove', (account, next) => {
  // Remove all transactions that are apart of this account
  account.getTransactions((err, transactions) => {
    if (err) return next(err);
    async.each(transactions, (transaction, done) => {
      transaction.remove(done);
    }, next);
  });
});

export default Account;
