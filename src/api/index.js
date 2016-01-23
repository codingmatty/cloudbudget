import inflection from 'inflection';
import { Router } from 'express';
import users from './users';
import oauth2 from './oauth2';
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
api.use('/oauth2', oauth2);
api.use('/accounts', accounts);
api.use('/transactions', transactions);

api.use((req, res) => {
  res.status(404).send();
});

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
    errors: errorObj
  });
}

export function getInclusions(req) {
  return Array.isArray(req.query.include) ? req.query.include.join(' ') : req.query.include || '';
}

export function buildQuery(Model, req) {
  const query = {};
  Model.schema.eachPath((path) => {
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

export default api;
