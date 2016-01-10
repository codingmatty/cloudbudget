import _ from 'lodash';
import passport from 'passport';
import { Router } from 'express';
import { User, AccessToken } from '../db';
import { handleError } from './index';

const api = new Router();

api.post('/register', (req, res) => {
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

api.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ username }, (queryErr, user) => {
    if (queryErr || !user) { return handleError(queryErr, res, 'login', 'User'); }
    if (!user.verifyPassword(password)) { return handleError(new Error('Authentication Error'), res, 'login', 'User'); }
    const token = user.generateJwt();
    user.save((saveErr) => { // Save nonce generated for JWT
      if (saveErr) { return handleError(saveErr, res, 'login', 'User'); }
      res.status(200).send({
        message: 'Login Succeeded!',
        data: user,
        token
      });
    });
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
