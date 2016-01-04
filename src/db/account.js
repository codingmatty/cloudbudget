import _ from 'lodash';
import async from 'async';
import mongoose, { Schema, Types } from 'mongoose';
import { defaultJSONOptions, Transaction, AccountGroup } from './';

const accountSchema = new Schema({
  name: { type: String, required: true },
  accountType: { type: String, enum: ['savings', 'checking', 'credit_card', 'loan', 'investment'], required: true },
  budget: { type: Boolean, required: true },
  notes: String,
  accountGroup: { type: Schema.Types.ObjectId, ref: 'AccountGroup', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }]
}, {
  toJSON: defaultJSONOptions((doc, ret) => {
    ret.accountGroup = ret.accountGroup instanceof Types.ObjectId ? ret.accountGroup.toString() : ret.accountGroup;
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

Account.schema.pre('save', function addAccountIdToAccountGroup(next) {
  const account = this;
  AccountGroup.findById(account.accountGroup, (err, accountGroup) => {
    accountGroup.accounts.push(account.id);
    accountGroup.save();
    next();
  });
});

Account.schema.post('remove', (account, next) => {
  async.parallel([
    (callback) => {
      // Remove account from accountGroup
      AccountGroup.findById(account.accountGroup, (err, accountGroup) => {
        if (!accountGroup) return;
        const index = accountGroup.accounts.indexOf(account.id);
        accountGroup.accounts.splice(index, 1);
        accountGroup.save(callback);
      });
    },
    (callback) => {
      // Remove all transactions that are apart of this account
      Transaction.find({ account: account.id }, (err, transactions) => {
        if (err) return callback(err);
        async.each(transactions, (transaction, done) => {
          transaction.remove(done);
        }, callback);
      });
    }
  ], next);
});

export default Account;
