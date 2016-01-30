'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _randomKey = require('random-key');

var _randomKey2 = _interopRequireDefault(_randomKey);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _ = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var accessTokenSchema = new _mongoose.Schema({
  userId: { type: _mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: _mongoose.Schema.Types.ObjectId, ref: 'Client' },
  token: { type: String, required: true, minlength: 64, maxlength: 64 },
  refreshToken: { type: String, required: true, minlength: 64, maxlength: 64 },
  date: { type: Date, default: Date.now, expires: '14d' } // AccessToken expires in 14 days.
}, {
  toJSON: (0, _.defaultJSONOptions)()
});

accessTokenSchema.statics.generateTokens = function () {
  return {
    token: _randomKey2.default.generate(64),
    refreshToken: _randomKey2.default.generate(64)
  };
};

var AccessToken = _mongoose2.default.model('AccessToken', accessTokenSchema);

exports.default = AccessToken;