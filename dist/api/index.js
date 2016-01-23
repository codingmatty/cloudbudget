'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleError = handleError;
exports.getInclusions = getInclusions;
exports.buildQuery = buildQuery;

var _inflection = require('inflection');

var _inflection2 = _interopRequireDefault(_inflection);

var _express = require('express');

var _users = require('./users');

var _users2 = _interopRequireDefault(_users);

var _oauth = require('./oauth2');

var _oauth2 = _interopRequireDefault(_oauth);

var _accounts = require('./accounts');

var _accounts2 = _interopRequireDefault(_accounts);

var _transactions = require('./transactions');

var _transactions2 = _interopRequireDefault(_transactions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var api = new _express.Router();

// perhaps expose some API metadata at the root
api.get('/', function (req, res) {
  res.status(200).send({
    version: '0.0.2'
  });
});

api.use('/users', _users2.default);
api.use('/oauth2', _oauth2.default);
api.use('/accounts', _accounts2.default);
api.use('/transactions', _transactions2.default);

api.use(function (req, res) {
  res.status(404).send();
});

function handleError(err, res, method, model) {
  var errorObj = err;
  if (err) {
    if (err.errors) {
      errorObj = {};
      for (var singleErrKey in err.errors) {
        if (err.errors.hasOwnProperty(singleErrKey)) {
          errorObj[singleErrKey] = err.errors[singleErrKey].message;
        }
      }
    } else if (err.code === 11000) {
      var errmsgRegex = /index: (\S+\$)?([\w\d]+)_.* dup key: { : \\?\"(\S+)\\?\" }$/;
      if (errmsgRegex.test(err.errmsg)) {
        var _errmsgRegex$exec = errmsgRegex.exec(err.errmsg);

        var _errmsgRegex$exec2 = _slicedToArray(_errmsgRegex$exec, 4);

        var field = _errmsgRegex$exec2[2];
        var value = _errmsgRegex$exec2[3];

        errorObj = _defineProperty({}, field, field + ' \'' + value + '\' already exists.');
      }
    }
  }
  res.status(400).send({
    message: 'Error! Unable to ' + method + ' ' + (method === 'list' ? _inflection2.default.pluralize(model) : model) + '.',
    errors: errorObj
  });
}

function getInclusions(req) {
  return Array.isArray(req.query.include) ? req.query.include.join(' ') : req.query.include || '';
}

function buildQuery(Model, req) {
  var query = {};
  Model.schema.eachPath(function (path) {
    if (req.query[path]) {
      if (Array.isArray(req.query[path])) {
        query[path] = { $in: req.query[path] };
      } else if (/([\w\d]*,)+[\w\d]*/.test(req.query[path])) {
        query[path] = { $in: req.query[path].split(',') };
      } else {
        query[path] = req.query[path];
      }
    }
  });
  if (req.query.id) {
    if (Array.isArray(req.query.id)) {
      query._id = { $in: req.query.id };
    } else if (/([\w\d]*,)+[\w\d]*/.test(req.query.id)) {
      query._id = { $in: req.query.id.split(',') };
    } else {
      query._id = req.query.id;
    }
  }
  return query;
}

exports.default = api;