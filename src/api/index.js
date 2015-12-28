import { Router } from 'express';
import inflection from 'inflection';
import users from './users';
import accounts from './accounts';
import transactions from './transactions';

const api = new Router();

// perhaps expose some API metadata at the root
api.get('/', (req, res) => {
  res.json({
    version: '0.0.2'
  });
});

api.use('/users', users);
api.use('/accounts', accounts);
api.use('/transactions', transactions);

export function handleError(err, res, method, model) {
  res.status(400).send({
    error: `Unable to ${method} ${method === 'list' ? inflection.pluralize(model) : model}`,
    msg: err
  });
}

export function getInclusions(req) {
  return Array.isArray(req.query.include) ? req.query.include.join(' ') : req.query.include || '';
}

export function authenticate(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).send({
      msg: 'Unauthorized Action'
    });
  }
  next();
}

export default api;
