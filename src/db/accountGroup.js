import _ from 'lodash';
import mongoose, { Schema, Types } from 'mongoose';
import async from 'async';
import { defaultJSONOptions, Account } from './';

const accountGroupSchema = new Schema({
  name: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accounts: [{ type: Schema.Types.ObjectId, ref: 'Account' }]
}, {
  toJSON: defaultJSONOptions((doc, ret) => {
    ret.accounts = ret.accounts.map(account => account instanceof Types.ObjectId ? account.toString() : account);
  })
});

accountGroupSchema.static('readonlyProps', () => {
  return ['acccounts', 'user'];
});

accountGroupSchema.methods.getBalance = function getBalance(done) {
  const accountGroup = this;
  Account.find({ accountGroup: accountGroup.id }, (queryErr, accounts) => {
    if (queryErr) return done(queryErr);
    async.map(accounts, (account, callback) => {
      account.getBalance(callback);
    }, (err, balances) => {
      done(null, _.sum(balances));
    });
  });
};

// Remove all accounts that are apart of this group
accountGroupSchema.post('remove', (accountGroup, next) => {
  Account.find({ accountGroup: accountGroup.id }, (err, accounts) => {
    accounts.forEach((account) => {
      account.remove(next);
    });
  });
});

const AccountGroup = mongoose.model('AccountGroup', accountGroupSchema);
export default AccountGroup;
