import { Router } from 'express';
import inflection from 'inflection';
import users from './users';
import accounts from './accounts';
import transactions from './transactions';

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

export function handleError(err, res, method, model) {
  let errorObj = err;
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
      const [,, field, value] = errmsgRegex.exec(err.errmsg);
      errorObj = {
        [field]: `${field} '${value}' already exists.`
      };
    }
  }
  res.status(400).send({
    message: `Error! Unable to ${method} ${method === 'list' ? inflection.pluralize(model) : model}`,
    error: errorObj
  });
}

export function getInclusions(req) {
  return Array.isArray(req.query.include) ? req.query.include.join(' ') : req.query.include || '';
}

export function authenticate(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).send({
      message: 'Unauthorized Action'
    });
  } else {
    next();
  }
}

export default api;
