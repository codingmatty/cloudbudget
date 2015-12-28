import _ from 'lodash';
// import passport from 'passport';
import { Router } from 'express';
import * as db from '../db';
import { handleError, getInclusions, authenticate } from './index';

export default function (model, shouldAuthenticate, actions = ['list', 'create', 'show', 'update', 'delete']) {
  const Model = db[model];
  const api = new Router();
  const addUserToParams = (queryParams = {}, userId) => {
    if (shouldAuthenticate) {
      return _.merge({ user: userId }, queryParams);
    }
    return queryParams;
  };

  if (shouldAuthenticate) {
    // api.use(passport.authenticate('basic'));
    api.use(authenticate);
  }

  actions.forEach((action) => {
    switch (action) {
      case 'list':
        // GET - List
        api.get('/', (req, res) => {
          Model.find(addUserToParams({}, req.user.id)).populate(getInclusions(req)).exec((err, docs) => {
            if (err) {
              handleError(err, res, 'list', model);
            } else {
              res.status(200).send({ data: docs });
            }
          });
        });
        break;
      case 'create':
        // POST - Create
        api.post('/', (req, res) => {
          const entity = addUserToParams(req.body, req.user.id);
          Model.create(entity, (err, doc) => {
            if (err) {
              handleError(err, res, 'create', model);
            } else {
              res.status(201).send({
                msg: `Success! ${model} created`,
                data: doc
              });
            }
          });
        });
        break;
      case 'show':
        // GET - Show
        api.get('/:id', (req, res) => {
          const query = addUserToParams({ _id: req.params.id }, req.user.id);
          Model.findOne(query).populate(getInclusions(req)).exec((err, doc) => {
            if (err) {
              handleError(err, res, 'show', model);
            } else {
              res.status(200).send({ data: doc });
            }
          });
        });
        break;
      case 'update':
        // PUT - Update
        api.put('/:id', (req, res) => {
          const query = addUserToParams({ _id: req.params.id }, req.user.id);
          Model.findOneAndUpdate(query, req.body, { new: true }, (err, doc) => {
            if (err) {
              handleError(err, res, 'update', model);
            } else {
              res.status(200).send({
                msg: `Success! ${model} updated`,
                data: doc
              });
            }
          });
        });
        break;
      case 'delete':
        // DELETE - Delete
        api.delete('/:id', (req, res) => {
          const query = addUserToParams({ _id: req.params.id }, req.user.id);
          Model.findOne(query, (queryErr, queryDoc) => {
            if (queryErr) {
              handleError(queryErr, res, 'delete', model);
            } else {
              queryDoc.remove((err, doc) => {
                if (err) {
                  handleError(err, res, 'delete', model);
                } else {
                  res.status(200).send({
                    msg: `Success! ${model} deleted.`,
                    data: doc
                  });
                }
              });
            }
          });
        });
        break;
      default:
    }
  });

  return api;
}
