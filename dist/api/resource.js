'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.listMethod = listMethod;
exports.createMethod = createMethod;
exports.showMethod = showMethod;
exports.updateMethod = updateMethod;
exports.deleteMethod = deleteMethod;

exports.default = function (model, shouldAuthenticate) {
  var actions = arguments.length <= 2 || arguments[2] === undefined ? ['list', 'create', 'show', 'update', 'delete'] : arguments[2];

  var api = new _express.Router();

  if (shouldAuthenticate) {
    api.use(_passport2.default.authenticate(['jwt', 'bearer'], { session: false }));
  }

  actions.forEach(function (action) {
    switch (action) {
      case 'list':
        // GET - List
        listMethod(api, model, shouldAuthenticate, function (req, res, docs) {
          res.status(200).send({ data: docs });
        });
        break;
      case 'create':
        // POST - Create
        createMethod(api, model, shouldAuthenticate, function (req, res, doc) {
          res.status(201).send({
            message: 'Success! ' + model + ' created.',
            data: doc
          });
        });
        break;
      case 'show':
        // GET - Show
        showMethod(api, model, shouldAuthenticate, function (req, res, doc) {
          res.status(200).send({ data: doc });
        });
        break;
      case 'update':
        // PUT - Update
        updateMethod(api, model, shouldAuthenticate, function (req, res, doc) {
          res.status(200).send({
            message: 'Success! ' + model + ' updated.',
            data: doc
          });
        });
        break;
      case 'delete':
        // DELETE - Delete
        deleteMethod(api, model, shouldAuthenticate, function (req, res, doc) {
          res.status(200).send({
            message: 'Success! ' + model + ' deleted.',
            data: doc
          });
        });
        break;
      default:
    }
  });

  return api;
};

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _express = require('express');

var _db = require('../db');

var db = _interopRequireWildcard(_db);

var _index = require('./index');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function listMethod(api, model, shouldAuthenticate, callback) {
  var Model = db[model];
  api.get('/', function (req, res) {
    var query = (0, _index.buildQuery)(Model, req);
    if (shouldAuthenticate) {
      query.user = req.user.id;
    }
    Model.find(query).populate((0, _index.getInclusions)(req)).exec(function (err, docs) {
      if (err) {
        return (0, _index.handleError)(err, res, 'list', Model.modelName);
      }
      _async2.default.map(docs, function (doc, next) {
        if (doc.normalize) {
          doc.normalize(_lodash2.default.partial(next, null));
        } else {
          next(null, doc);
        }
      }, function (normalizeErr, normalizeDocs) {
        if (normalizeErr) {
          return (0, _index.handleError)(normalizeErr, res, 'list', Model.modelName);
        }
        callback(req, res, normalizeDocs);
      });
    });
  });
}

function createMethod(api, model, shouldAuthenticate, callback) {
  var Model = db[model];
  api.post('/', function (req, res) {
    var entity = req.body;
    if (shouldAuthenticate) {
      entity.user = req.user.id;
    }
    Model.create(entity, function (err, doc) {
      if (err) {
        return (0, _index.handleError)(err, res, 'create', Model.modelName);
      }
      if (doc.normalize) {
        doc.normalize(_lodash2.default.partial(callback, req, res));
      } else {
        callback(req, res, doc);
      }
    });
  });
}

function showMethod(api, model, shouldAuthenticate, callback) {
  var Model = db[model];
  api.get('/:id', function (req, res) {
    var query = { _id: req.params.id };
    if (shouldAuthenticate) {
      query.user = req.user.id;
    }
    Model.findOne(query).populate((0, _index.getInclusions)(req)).exec(function (err, doc) {
      if (err || !doc) {
        return (0, _index.handleError)(err, res, 'show', Model.modelName);
      }
      if (doc.normalize) {
        doc.normalize(_lodash2.default.partial(callback, req, res));
      } else {
        callback(req, res, doc);
      }
    });
  });
}

function updateMethod(api, model, shouldAuthenticate, callback) {
  var Model = db[model];
  api.put('/:id', function (req, res) {
    var query = { _id: req.params.id };
    if (shouldAuthenticate) {
      query.user = req.user.id;
    }
    Model.findOne(query, function (findErr, doc) {
      if (findErr) {
        return (0, _index.handleError)(findErr, res, 'update', Model.modelName);
      }
      var updatedDoc = _lodash2.default.merge(doc, _lodash2.default.omit(req.body, Model.readonlyProps() || []));
      updatedDoc.save(function (saveErr, savedDoc) {
        if (saveErr) {
          return (0, _index.handleError)(saveErr, res, 'update', Model.modelName);
        }
        if (savedDoc.normalize) {
          savedDoc.normalize(_lodash2.default.partial(callback, req, res));
        } else {
          callback(req, res, savedDoc);
        }
      });
    });
  });
}

function deleteMethod(api, model, shouldAuthenticate, callback) {
  var Model = db[model];
  api.delete('/:id', function (req, res) {
    var query = { _id: req.params.id };
    if (shouldAuthenticate) {
      query.user = req.user.id;
    }
    Model.findOne(query, function (findErr, doc) {
      if (findErr || !doc) {
        return (0, _index.handleError)(findErr, res, 'delete', model);
      }
      doc.remove(req.query, function (removeErr, removedDoc) {
        if (removeErr) {
          return (0, _index.handleError)(removeErr, res, 'delete', model);
        }
        if (removedDoc.normalize) {
          removedDoc.normalize(_lodash2.default.partial(callback, req, res));
        } else {
          callback(req, res, removedDoc);
        }
      });
    });
  });
}