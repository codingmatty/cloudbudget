import mongoose, { Schema } from 'mongoose';
import Transaction from './transaction';

const accountSchema = new Schema({
  name: { type: String, required: true },
  accountType: { type: String, enum: ['savings', 'checking', 'credit_card', 'loan', 'investment'], default: 'savings' },
  budget: { type: Boolean, required: true },
  accountGroup: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }]
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

accountSchema.methods.getBalance = function getBalance(cb) {
  const account = this;
  let balance = 0;
  Transaction.find({ _id: { $in: account.transactions } }, (err, transactions) => {
    balance = transactions.reduce((sum, transaction) => {
      return sum + transaction.amount;
    }, 0);
    cb(balance);
  });
};

accountSchema.post('remove', (account) => {
  Transaction.find({ _id: { $in: account.transactions } }, (err, transactions) => {
    transactions.forEach((transaction) => {
      transaction.remove(() => {
        console.log('Transaction removed: ' + transaction);
      });
    });
  });
});

const Account = mongoose.model('Account', accountSchema);
export default Account;
