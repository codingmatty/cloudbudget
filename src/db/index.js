import mongoose from 'mongoose';
import User from './user';
import Account from './account';
import Transaction from './transaction';
import config from '../../config.json';

const db = mongoose.connect(config[process.env.NODE_ENV].db);

export default db;
export {
  User,
  Account,
  Transaction
};
