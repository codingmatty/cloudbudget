import _ from 'lodash';
import passport from 'passport';
import { Router } from 'express';
import { handleError } from './index';
import { User, AccessToken } from '../db';

const api = new Router();

api.post('/register', passport.authenticate(['basic', 'oauth2-client-password'], { session: false }), (req, res) => {
  const newUser = _.merge(req.body, { password: User.hashPassword(req.body.password) });
  User.create(newUser, (createErr, user) => {
    if (createErr) { return handleError(createErr, res, 'create', 'User'); }
    res.status(201).send({
      message: `Success! User created.`,
      data: user
    });
  });
});

api.put('/:id', passport.authenticate(['jwt', 'bearer'], { session: false }), (req, res) => {
  if (req.body.password) {
    req.body.password = User.hashPassword(req.body.password);
    req.body.$unset = { nonce: 1 };
  }
  User.findByIdAndUpdate(req.params.id, req.body, { new: true }, (updateErr, user) => {
    if (updateErr) { return handleError(updateErr, res, 'update', 'User'); }
    res.status(200).send({
      message: `Success! User updated.`,
      data: user
    });
  });
});

api.get('/info', passport.authenticate(['jwt', 'bearer'], { session: false }), (req, res) => {
  res.status(200).send({ data: req.user });
});

api.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  res.status(200).send({
    message: 'Login Succeeded!',
    data: req.user,
    token: req.user.token
  });
});

api.get('/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
  User.findByIdAndUpdate(req.user.id, { $unset: { nonce: 1 } }, (updateErr) => {
    if (updateErr) { return handleError(updateErr, res, 'logout', 'User'); }
    res.status(200).send({ message: 'Logout Succeeded!' });
  });
});

api.get('/revoke', passport.authenticate('bearer', { session: false }), (req, res) => {
  AccessToken.remove({ token: req.user.token }, (err) => {
    if (err) { return handleError(err, res, 'revoke', 'AccessToken'); }
    res.status(200).send({ message: 'Access Token Revoked!' });
  });
});

export default api;
