import { Router } from 'express';
import { User } from '../db';
import passport from 'passport';
// import { BasicStrategy } from 'passport-http';
import { Strategy } from 'passport-local';
const api = new Router();

// passport.use(new BasicStrategy(
//   (username, password, done) => {
//     User.findOne({ username }, (err, user) => {
//       if (err) { return done(err); }
//       if (!user) { return done(null, false); }
//       // if (user.password !== password) { return done(null, false); }
//       return done(null, user);
//     });
//   }
// ));
passport.use(new Strategy(
  (username, password, done) => {
    User.findOne({ username }, (err, user) => {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      // if (user.password !== password) { return done(null, false); }
      return done(null, user);
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

api.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ msg: 'Login Succeeded!', user: req.user });
});

export default api;
