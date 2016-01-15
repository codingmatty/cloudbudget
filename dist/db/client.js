'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is_js = require('is_js');

var _is_js2 = _interopRequireDefault(_is_js);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _randomKey = require('random-key');

var _randomKey2 = _interopRequireDefault(_randomKey);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _ = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var clientSchema = new _mongoose.Schema({
  name: { type: String, required: true, unique: true },
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true, unique: true },
  permissions: [{ type: String, enum: ['password', 'code'] }],
  redirectUrl: { type: String,
    validate: {
      validator: function validator(value) {
        return _is_js2.default.url(value);
      },
      message: '{VALUE} is not a valid url address.'
    }
  }
}, {
  toJSON: (0, _.defaultJSONOptions)()
});

clientSchema.statics.generateCredentials = function () {
  var secret = _randomKey2.default.generate(32);
  return {
    clientId: _randomKey2.default.generate(32),
    secret: secret,
    clientSecret: _bcrypt2.default.hashSync(secret, 8)
  };
};

clientSchema.methods.verifySecret = function verifyClientSecret(secret) {
  return _bcrypt2.default.compareSync(secret, this.clientSecret);
};

var Client = _mongoose2.default.model('Client', clientSchema);

exports.default = Client;