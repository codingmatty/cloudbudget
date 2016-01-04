import { Router } from 'express';
import inflection from 'inflection';
import users from './users';
import accounts from './accounts';
import transactions from './transactions';
import accountGroups from './accountGroups';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User } from '../db';

const api = new Router();

// perhaps expose some API metadata at the root
api.get('/', (req, res) => {
  res.status(200).send({
    version: '0.0.2'
  });
});

api.use('/users', users);
api.use('/accounts', accounts);
api.use('/transactions', transactions);
api.use('/accountGroups', accountGroups);

export function handleError(err, res, method, model) {
  let errorObj = err;
  if (err) {
    if (err.errors) {
      errorObj = {};
      for (const singleErrKey in err.errors) {
        if (err.errors.hasOwnProperty(singleErrKey)) {
          errorObj[singleErrKey] = err.errors[singleErrKey].message;
        }
      }
    } else if (err.code === 11000) {
      const errmsgRegex = /index: (\S+\$)?([\w\d]+)_.* dup key: { : \\?\"(\S+)\\?\" }$/;
      if (errmsgRegex.test(err.errmsg)) {
        const [, , field, value] = errmsgRegex.exec(err.errmsg);
        errorObj = {
          [field]: `${field} '${value}' already exists.`
        };
      }
    }
  }
  res.status(400).send({
    message: `Error! Unable to ${method} ${method === 'list' ? inflection.pluralize(model) : model}.`,
    error: errorObj
  });
}

export function getInclusions(req) {
  return Array.isArray(req.query.include) ? req.query.include.join(' ') : req.query.include || '';
}

export function authenticate(req, res, next) {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (!token) {
    return res.status(401).send({
      message: 'Unauthorized Action! No Token Provided.'
    });
  }
  function failedToAuthenticate(tokenExpired) {
    res.status(401).send({
      message: tokenExpired ? 'Token Expired.' : 'Failed to authenticate token.'
    });
  }
  const userId = jwt.decode(token).id;
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return failedToAuthenticate();
  }
  User.findById(userId, (queryErr, user) => {
    if (queryErr) {
      return failedToAuthenticate();
    }
    jwt.verify(token, user.key, (err, decodedUser) => {
      if (err || userId !== decodedUser.id) {
        return failedToAuthenticate(err.name === 'TokenExpiredError');
      }
      req.user = decodedUser;
      next();
    });
  });
}

export default api;
