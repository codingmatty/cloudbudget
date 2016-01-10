import _ from 'lodash';
import passport from 'passport';
import { Router } from 'express';
import * as db from '../db';
import { handleError, getInclusions, buildQuery } from './index';

export function listMethod(api, model, shouldAuthenticate, callback) {
  const Model = db[model];
  api.get('/', (req, res) => {
    const query = buildQuery(Model, req);
    if (shouldAuthenticate) {
      query.user = req.user.id;
    }
    Model.find(query).populate(getInclusions(req)).exec((err, docs) => {
      if (err) { return handleError(err, res, 'list', Model.modelName); }
      callback(req, res, docs);
    });
  });
}

export function createMethod(api, model, shouldAuthenticate, callback) {
  const Model = db[model];
  api.post('/', (req, res) => {
    const entity = req.body;
    if (shouldAuthenticate) {
      entity.user = req.user.id;
    }
    Model.create(entity, (err, doc) => {
      if (err) { return handleError(err, res, 'create', Model.modelName); }
      callback(req, res, doc);
    });
  });
}

export function showMethod(api, model, shouldAuthenticate, callback) {
  const Model = db[model];
  api.get('/:id', (req, res) => {
    const query = { _id: req.params.id };
    if (shouldAuthenticate) {
      query.user = req.user.id;
    }
    Model.findOne(query).populate(getInclusions(req)).exec((err, doc) => {
      if (err || !doc) { return handleError(err, res, 'show', Model.modelName); }
      callback(req, res, doc);
    });
  });
}

export function updateMethod(api, model, shouldAuthenticate, callback) {
  const Model = db[model];
  api.put('/:id', (req, res) => {
    const query = { _id: req.params.id };
    if (shouldAuthenticate) {
      query.user = req.user.id;
    }
    Model.findOneAndUpdate(query, _.omit(req.body, Model.readonlyProps() || []), { new: true }, (err, doc) => {
      if (err) { return handleError(err, res, 'update', Model.modelName); }
      callback(req, res, doc);
    });
  });
}

export function deleteMethod(api, model, shouldAuthenticate, callback) {
  const Model = db[model];
  api.delete('/:id', (req, res) => {
    const query = { _id: req.params.id };
    if (shouldAuthenticate) {
      query.user = req.user.id;
    }
    Model.findOne(query, (queryErr, queryDoc) => {
      if (queryErr || !queryDoc) { return handleError(queryErr, res, 'delete', model); }
      queryDoc.remove(req.query, (removeErr, doc) => {
        if (removeErr) { return handleError(removeErr, res, 'delete', model); }
        callback(req, res, doc);
      });
    });
  });
}

export default function (model, shouldAuthenticate, actions = ['list', 'create', 'show', 'update', 'delete']) {
  const api = new Router();

  if (shouldAuthenticate) {
    api.use(passport.authenticate(['jwt', 'bearer'], { session: false }));
  }

  actions.forEach((action) => {
    switch (action) {
      case 'list':
        // GET - List
        listMethod(api, model, shouldAuthenticate, (req, res, docs) => {
          res.status(200).send({ data: docs });
        });
        break;
      case 'create':
        // POST - Create
        createMethod(api, model, shouldAuthenticate, (req, res, doc) => {
          res.status(201).send({
            message: `Success! ${model} created.`,
            data: doc
          });
        });
        break;
      case 'show':
        // GET - Show
        showMethod(api, model, shouldAuthenticate, (req, res, doc) => {
          res.status(200).send({ data: doc });
        });
        break;
      case 'update':
        // PUT - Update
        updateMethod(api, model, shouldAuthenticate, (req, res, doc) => {
          res.status(200).send({
            message: `Success! ${model} updated.`,
            data: doc
          });
        });
        break;
      case 'delete':
        // DELETE - Delete
        deleteMethod(api, model, shouldAuthenticate, (req, res, doc) => {
          res.status(200).send({
            message: `Success! ${model} deleted.`,
            data: doc
          });
        });
        break;
      default:
    }
  });

  return api;
}
