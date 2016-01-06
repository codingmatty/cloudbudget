import _ from 'lodash';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../db';
import { handleError, authenticate } from './index';
import randomKey from 'random-key';
import jwt from 'jsonwebtoken';

const api = new Router();

api.post('/register', (req, res) => {
  bcrypt.hash(req.body.password, 8, (hashErr, hash) => {
    if (hashErr) { return handleError(hashErr, res, 'create', 'User'); }
    const newUser = _.merge(req.body, { password: hash });
    User.create(newUser, (createErr, user) => {
      if (createErr) { return handleError(createErr, res, 'create', 'User'); }
      res.status(201).send({
        message: `Success! User created.`,
        data: user
      });
    });
  });
});

api.put('/:id', authenticate, (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 8);
    req.body.$unset = { key: 1 };
  }
  User.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true }, (updateErr, user) => {
    if (updateErr) { return handleError(updateErr, res, 'update', 'User'); }
    res.status(200).send({
      message: `Success! User updated.`,
      data: user
    });
  });
});

api.get('/info', authenticate, (req, res) => {
  res.status(200).send({ data: req.user });
});

api.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ username }, (queryErr, user) => {
    if (queryErr || !user) { return handleError(queryErr, res, 'login', 'User'); }
    bcrypt.compare(password, user.password, (hashErr, result) => {
      if (hashErr || !result) { return handleError(hashErr, res, 'login', 'User'); }
      user.key = randomKey.generate(60);
      user.save((saveErr, updatedUser) => {
        if (saveErr) { return handleError(saveErr, res, 'login', 'User'); }
        jwt.sign(updatedUser.toJSON(), updatedUser.key, {
          expiresIn: '7d'
        }, (token) => {
          res.status(200).send({
            message: 'Login Succeeded!',
            data: updatedUser,
            token
          });
        });
      });
    });
  });
});

api.get('/logout', authenticate, (req, res) => {
  User.findByIdAndUpdate(req.user.id, { $unset: { key: 1 } }, (updateErr) => {
    if (updateErr) { return handleError(updateErr, res, 'logout', 'User'); }
    res.status(200).send({ message: 'Logout Succeeded!' });
  });
});

export default api;
