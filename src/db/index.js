import mongoose from 'mongoose';
import User from './user';
import Account from './account';
import Transaction from './transaction';

const db = mongoose.connect('mongodb://localhost/cloudbudget_dev');

export default db;
export {
  User,
  Account,
  Transaction
};
