import _ from 'lodash';
import async from 'async';
import passport from 'passport';
import { Router } from 'express';
import resource from './resource';
import { buildQuery, handleError } from './index';
import { Account } from '../db';

const api = new Router();
api.use(passport.authenticate(['jwt', 'bearer'], { session: false }));

// Update Multiple
api.put('/', (req, res) => {
  const query = buildQuery(Account, req);
  query.user = req.user.id;
  Account.find(query, (findErr, accounts) => {
    if (findErr) { return handleError(findErr, res, 'update', 'Accounts'); }
    const updatedAccounts = accounts.map((transaction) => _.merge(transaction, _.omit(req.body, Account.readonlyProps() || [])));
    async.map(updatedAccounts, (transaction, callback) => {
      transaction.save(callback);
    }, (saveErr, dbAccounts) => {
      if (saveErr) { return handleError(saveErr, res, 'delete', 'Accounts'); }
      async.map(dbAccounts, (dbAccount, next) => {
        if (dbAccount.normalize) {
          dbAccount.normalize(_.partial(next, null));
        } else {
          next(null, dbAccount);
        }
      }, (normalizeErr, normalizeAccounts) => {
        if (normalizeErr) { return handleError(normalizeErr, res, 'list', Account.modelName); }
        res.status(200).send({
          message: `Success! Accounts updated.`,
          data: normalizeAccounts
        });
      });
    });
  });
});

api.use('/', resource('Account', true, ['list', 'create', 'show', 'update', 'delete']));

export default api;
