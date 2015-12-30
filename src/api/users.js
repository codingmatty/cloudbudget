import _ from 'lodash';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../db';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { handleError, authenticate } from './index';

const api = new Router();

passport.use(new Strategy(
  (username, password, done) => {
    User.findOne({ username }, (err, user) => {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      console.log(password, user.password);
      bcrypt.compare(password, user.password, (hashErr, res) => {
        console.log(res);
        if (res) {
          return done(null, user);
        }
        return done(null, false);
      });
    });
  }
  ));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

api.post('/register', (req, res) => {
  bcrypt.hash(req.body.password, 8, (hashErr, hash) => {
    const newUser = _.merge(req.body, { password: hash });
    User.create(newUser, (err, user) => {
      if (err) {
        handleError(err, res, 'create', 'User');
      } else {
        res.status(201).send({
          msg: `Success! User created`,
          data: user
        });
      }
    });
  });
});

api.put('/:id', (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 8);
  }
  User.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }, (err, user) => {
    if (err) {
      handleError(err, res, 'update', 'User');
    } else {
      res.status(200).send({
        msg: `Success! User updated`,
        data: user
      });
    }
  });
});

api.get('/current', (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.json({ msg: 'No User Logged In.' });
  }
});

api.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ msg: 'Login Succeeded!', user: req.user });
});

api.get('/logout', authenticate, (req, res) => {
  req.logout();
  res.json({ msg: 'Logout Succeeded!' });
});

export default api;
