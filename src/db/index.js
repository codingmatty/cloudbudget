import mongoose, { Types } from 'mongoose';
import User from './user';
import Client from './client';
import Account from './account';
import AccessToken from './accessToken';
import Transaction from './transaction';
import config from '../../config.json';

const db = mongoose.connect(config[process.env.NODE_ENV].db);

export default db;

export function defaultJSONOptions(specificTransformFunction) {
  return {
    getters: true,
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      ret.id = ret.id.toString();
      if (ret.user) {
        ret.user = ret.user instanceof Types.ObjectId ? ret.user.toString() : ret.user;
      }
      if (specificTransformFunction) specificTransformFunction(doc, ret);
    }
  };
}

export {
  User,
  Client,
  AccessToken,
  Account,
  Transaction
};
