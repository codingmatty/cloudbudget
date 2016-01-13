import _ from 'lodash';
import fs from 'fs';
import is from 'is_js';
import bcrypt from 'bcrypt';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import randomKey from 'random-key';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions } from './';


const nonceSchema = new Schema({
  key: { type: String, required: true },
  date: { type: Date, default: Date.now, expires: '1d' }
});

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true,
    validate: {
      validator: (value) => {return is.email(value);},
      message: '{VALUE} is not a valid email address.'
    }
  },
  verified: { type: Boolean, default: true },
  nonce: nonceSchema,
  firstName: String,
  lastName: String,
  phone: { type: String,
    validate: {
      validator: (value) => {return is.nanpPhone(value) || is.eppPhone(value);},
      message: '{VALUE} is not a valid phone number.'
    }
  }
}, {
  toJSON: defaultJSONOptions((doc, ret) => {
    delete ret.password;
    delete ret.nonce;
  })
});

userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 8);
};

userSchema.methods.verifyUser = function verifyUser(nonce, callback) {
  const user = this;
  if (user.nonce && nonce.key === user.nonce.key) {
    user.update({ verified: true }, callback);
  }
};

userSchema.methods.generateJwt = function generateJwt(options = {}) {
  const user = this;
  user.nonce = { key: randomKey.generate(64) };
  const key = fs.readFileSync(__dirname + '/../../private.pem').toString();
  return jwt.sign(user.toJSON(), key, _.merge({
    algorithm: 'RS256',
    expiresIn: '1d',
    audience: 'cloudbudget.io',
    issuer: 'admin@cloudbudget.io',
    jwtid: user.nonce.key
  }, options));
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  const user = this;
  return user.verified && bcrypt.compareSync(password, user.password);
};

userSchema.methods.verifyNonce = function verifyNonce(nonceKey) {
  const user = this;
  return user.nonce && moment(user.nonce.date).add(1, 'days') >= moment() && user.nonce.key === nonceKey;
};

const User = mongoose.model('User', userSchema);

export default User;
