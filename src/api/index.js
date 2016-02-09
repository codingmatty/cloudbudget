import _ from 'lodash';
import moment from 'moment';
import inflection from 'inflection';
import { Router } from 'express';
import { Types } from 'mongoose';
import users from './users';
import oauth2 from './oauth2';
import accounts from './accounts';
import transactions from './transactions';
import schedules from './schedules';
import aggregate from './aggregate';

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
api.use('/schedules', schedules);
api.use('/aggregate', aggregate);

api.use((req, res) => {
  res.status(404).send();
});

export function handleError(err, res, method, model) {
  let errorObj = err;
  if (err) {
    if (err.errors) {
      errorObj = {};
      _.forOwn(err.errors, (singleErr, singleErrKey) => {
        _.set(errorObj, singleErrKey, singleErr.message);
      });
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

function addQuery(reqQuery, query, path) {
  if (reqQuery[path]) {
    if (Array.isArray(reqQuery[path])) {
      query[path] = { $in: reqQuery[path] };
    } else if (/([\w\d]*,)+[\w\d]*/.test(reqQuery[path])) {
      query[path] = { $in: reqQuery[path].split(',') };
    } else {
      query[path] = reqQuery[path];
    }
  }
}

function traverseSchema(schema, reqQuery, query, superPath) {
  schema.eachPath((path) => {
    if (schema.path(path).schema) {
      traverseSchema(schema.path(path).schema, reqQuery, query, superPath ? `${superPath}.${path}` : path);
    } else {
      addQuery(reqQuery, query, superPath ? `${superPath}.${path}` : path);
    }
  });
}

export function buildQuery(Model, req) {
  const query = {};
  // query based on given properties that match schema props
  traverseSchema(Model.schema, req.query, query);
  // now add range query options
  if (req.query.before_id || req.query.end) {
    let beforeId;
    let endId;
    if (req.query.before_id && Types.ObjectId.isValid(req.query.before_id)) {
      beforeId = new Types.ObjectId(req.query.before_id);
    }
    if (req.query.end) {
      if (moment(req.query.end).isValid()) {
        endId = Types.ObjectId.createFromTime(moment(req.query.end).format('X'));
      } else if (Types.ObjectId.isValid(req.query.end)) {
        endId = new Types.ObjectId(req.query.end);
      }
    }
    if (beforeId && (!endId || moment(beforeId.getTimestamp()) < moment(endId.getTimestamp()))) {
      _.set(query, '_id.$lt', beforeId);
    } else if (endId) {
      _.set(query, '_id.$lte', endId);
    }
  }
  if (req.query.after_id || req.query.start) {
    let afterId;
    let startId;
    if (req.query.after_id && Types.ObjectId.isValid(req.query.after_id)) {
      afterId = new Types.ObjectId(req.query.after_id);
    }
    if (req.query.start) {
      if (moment(req.query.start).isValid()) {
        startId = Types.ObjectId.createFromTime(moment(req.query.start).format('X'));
      } else if (Types.ObjectId.isValid(req.query.start)) {
        startId = new Types.ObjectId(req.query.start);
      }
    }
    if (afterId && (!startId || moment(afterId.getTimestamp()) > moment(startId.getTimestamp()))) {
      _.set(query, '_id.$gt', afterId);
    } else if (startId) {
      _.set(query, '_id.$gte', startId);
    }
  }
  // now add id query options, which is higher precedence than range queries, so may overwrite the range queres
  if (req.query.id) {
    if (Array.isArray(req.query.id)) {
      query._id = { $in: req.query.id };
    } else {
      const match = req.query.id.match(/([\w\d]+(?:,\s?[\w\d]+)*)/);
      if (match) {
        query._id = { $in: match[1].split(',') };
      } else {
        query._id = req.query.id;
      }
    }
  }
  return query;
}

export default api;
