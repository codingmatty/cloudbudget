'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _is_js = require('is_js');

var _is_js2 = _interopRequireDefault(_is_js);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _randomKey = require('random-key');

var _randomKey2 = _interopRequireDefault(_randomKey);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _2 = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var nonceSchema = new _mongoose.Schema({
  key: { type: String, required: true },
  date: { type: Date, default: Date.now, expires: '1d' }
});

var userSchema = new _mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true,
    validate: {
      validator: function validator(value) {
        return _is_js2.default.email(value);
      },
      message: '{VALUE} is not a valid email address.'
    }
  },
  verified: { type: Boolean, default: true },
  nonce: nonceSchema,
  firstName: String,
  lastName: String,
  phone: { type: String,
    validate: {
      validator: function validator(value) {
        return _is_js2.default.nanpPhone(value) || _is_js2.default.eppPhone(value);
      },
      message: '{VALUE} is not a valid phone number.'
    }
  }
}, {
  toJSON: (0, _2.defaultJSONOptions)(function (doc, ret) {
    delete ret.password;
    delete ret.nonce;
    delete ret.verified;
  })
});

userSchema.statics.hashPassword = function (password) {
  return _bcrypt2.default.hashSync(password, 8);
};

userSchema.methods.verifyUser = function verifyUser(nonce, callback) {
  var user = this;
  if (user.nonce && nonce.key === user.nonce.key) {
    user.update({ verified: true }, callback);
  }
};

userSchema.methods.generateJwt = function generateJwt() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var user = this;
  user.nonce = { key: _randomKey2.default.generate(64) };
  var key = _fs2.default.readFileSync(__dirname + '/../../private.pem').toString();
  return _jsonwebtoken2.default.sign(user.toJSON(), key, _lodash2.default.merge({
    algorithm: 'RS256',
    expiresIn: '1d',
    audience: 'cloudbudget.io',
    issuer: 'admin@cloudbudget.io',
    jwtid: user.nonce.key
  }, options));
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  var user = this;
  return user.verified && _bcrypt2.default.compareSync(password, user.password);
};

userSchema.methods.verifyNonce = function verifyNonce(nonceKey) {
  var user = this;
  return user.nonce && (0, _moment2.default)(user.nonce.date).add(1, 'days') >= (0, _moment2.default)() && user.nonce.key === nonceKey;
};

var User = _mongoose2.default.model('User', userSchema);

exports.default = User;