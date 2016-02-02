import _ from 'lodash';
import async from 'async';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions, pruneReadOnlyProps, Transaction } from './';

const schema = new Schema({
  name: { type: String, required: true, minlength: 1 },
  group: { type: String, required: true, minlength: 1 },
  type: { type: String, enum: ['savings', 'checking', 'credit_card', 'loan', 'asset', 'investment'], required: true },
  budget: { type: Boolean, required: true },
  notes: String,
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  toJSON: defaultJSONOptions()
});

schema.statics.pruneReadOnlyProps = (objToPrune) => {
  const readOnlyProps = ['user'];
  return pruneReadOnlyProps(objToPrune, readOnlyProps);
};

schema.methods.normalize = function normalize(done) {
  const account = this;
  account.getBalance((err, balance) => {
    // if (err) return done(err);
    done(_.merge(account.toJSON(), { balance }));
  });
};

schema.methods.getTransactions = function getTransactions(done) {
  const account = this;
  Transaction.find({ account: account.id }, (err, transactions) => {
    if (err) return done(err);
    done(null, transactions);
  });
};

schema.methods.getBalance = function getBalance(done) {
  const account = this;
  account.getTransactions((err, transactions) => {
    if (err) return done(err);
    done(null, _.sumBy(transactions, 'amount'));
  });
};

const Account = mongoose.model('Account', schema);

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
