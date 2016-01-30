'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transaction = exports.Account = exports.AccessToken = exports.Client = exports.User = undefined;
exports.defaultJSONOptions = defaultJSONOptions;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _account = require('./account');

var _account2 = _interopRequireDefault(_account);

var _accessToken = require('./accessToken');

var _accessToken2 = _interopRequireDefault(_accessToken);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _config = require('../../config.json');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var db = _mongoose2.default.connect(_config2.default[process.env.NODE_ENV].db);

exports.default = db;
function defaultJSONOptions(specificTransformFunction) {
  return {
    getters: true,
    virtuals: true,
    transform: function transform(doc, ret) {
      delete ret._id;
      delete ret.__v;
      ret.id = ret.id.toString();
      if (ret.user) {
        ret.user = ret.user instanceof _mongoose.Types.ObjectId ? ret.user.toString() : ret.user;
      }
      if (specificTransformFunction) specificTransformFunction(doc, ret);
    }
  };
}

exports.User = _user2.default;
exports.Client = _client2.default;
exports.AccessToken = _accessToken2.default;
exports.Account = _account2.default;
exports.Transaction = _transaction2.default;