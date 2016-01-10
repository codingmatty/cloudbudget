import _ from 'lodash';
import fs from 'fs';
import is from 'is_js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import randomKey from 'random-key';
import mongoose, { Schema } from 'mongoose';
import { defaultJSONOptions } from './';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true,
    validate: {
      validator: (value) => {return is.email(value);},
      message: '{VALUE} is not a valid email address.'
    }
  },
  nonce: { type: String },
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

userSchema.methods.generateJwt = function generateJwt(options = {}) {
  this.nonce = randomKey.generate(64);
  const key = fs.readFileSync(__dirname + '/../../private.pem').toString();
  return jwt.sign(this.toJSON(), key, _.merge({
    algorithm: 'RS256',
    expiresIn: '1d',
    audience: 'cloudbudget.io',
    issuer: 'admin@cloudbudget.io',
    jwtid: this.nonce
  }, options));
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
