'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _express = require('express');

var _index = require('./index');

var _db = require('../db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api = new _express.Router();

api.post('/register', _passport2.default.authenticate(['basic', 'oauth2-client-password'], { session: false }), function (req, res) {
  var newUser = _lodash2.default.merge(req.body, { password: _db.User.hashPassword(req.body.password) });
  _db.User.create(newUser, function (createErr, user) {
    if (createErr) {
      return (0, _index.handleError)(createErr, res, 'create', 'User');
    }
    res.status(201).send({
      message: 'Success! User created.',
      data: user
    });
  });
});

api.put('/:id', _passport2.default.authenticate(['jwt', 'bearer'], { session: false }), function (req, res) {
  if (req.body.password) {
    req.body.password = _db.User.hashPassword(req.body.password);
    req.body.$unset = { nonce: 1 };
  }
  _db.User.findByIdAndUpdate(req.params.id, req.body, { new: true }, function (updateErr, user) {
    if (updateErr) {
      return (0, _index.handleError)(updateErr, res, 'update', 'User');
    }
    res.status(200).send({
      message: 'Success! User updated.',
      data: user
    });
  });
});

api.get('/info', _passport2.default.authenticate(['jwt', 'bearer'], { session: false }), function (req, res) {
  res.status(200).send({ data: req.user });
});

api.post('/login', _passport2.default.authenticate('local', { session: false }), function (req, res) {
  res.status(200).send({
    message: 'Login Succeeded!',
    data: req.user,
    token: req.user.token
  });
});

api.get('/logout', _passport2.default.authenticate('jwt', { session: false }), function (req, res) {
  _db.User.findByIdAndUpdate(req.user.id, { $unset: { nonce: 1 } }, function (updateErr) {
    if (updateErr) {
      return (0, _index.handleError)(updateErr, res, 'logout', 'User');
    }
    res.status(200).send({ message: 'Logout Succeeded!' });
  });
});

api.get('/revoke', _passport2.default.authenticate('bearer', { session: false }), function (req, res) {
  _db.AccessToken.remove({ token: req.user.token }, function (err) {
    if (err) {
      return (0, _index.handleError)(err, res, 'revoke', 'AccessToken');
    }
    res.status(200).send({ message: 'Access Token Revoked!' });
  });
});

exports.default = api;