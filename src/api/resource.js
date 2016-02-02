import _ from 'lodash';
import async from 'async';
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
      async.map(docs, (doc, next) => {
        if (doc.normalize) {
          doc.normalize(_.partial(next, null));
        } else {
          next(null, doc);
        }
      }, (normalizeErr, normalizeDocs) => {
        if (normalizeErr) { return handleError(normalizeErr, res, 'list', Model.modelName); }
        callback(req, res, normalizeDocs);
      });
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
      if (doc.normalize) {
        doc.normalize(_.partial(callback, req, res));
      } else {
        callback(req, res, doc);
      }
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
      if (doc.normalize) {
        doc.normalize(_.partial(callback, req, res));
      } else {
        callback(req, res, doc);
      }
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
    Model.findOne(query, (findErr, doc) => {
      if (findErr) { return handleError(findErr, res, 'update', Model.modelName); }
      const updatedDoc = _.merge(doc, Model.pruneReadOnlyProps(req.body));
      updatedDoc.save((saveErr, savedDoc) => {
        if (saveErr) { return handleError(saveErr, res, 'update', Model.modelName); }
        if (savedDoc.normalize) {
          savedDoc.normalize(_.partial(callback, req, res));
        } else {
          callback(req, res, savedDoc);
        }
      });
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
    Model.findOne(query, (findErr, doc) => {
      if (findErr || !doc) { return handleError(findErr, res, 'delete', model); }
      doc.remove(req.query, (removeErr, removedDoc) => {
        if (removeErr) { return handleError(removeErr, res, 'delete', model); }
        if (removedDoc.normalize) {
          removedDoc.normalize(_.partial(callback, req, res));
        } else {
          callback(req, res, removedDoc);
        }
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
