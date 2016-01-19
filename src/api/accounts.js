import _ from 'lodash';
import async from 'async';
import passport from 'passport';
import { Router } from 'express';
import resource, { listMethod, showMethod } from './resource';
import { buildQuery, handleError } from './index';
import { Account } from '../db';

const api = new Router();
api.use(passport.authenticate(['jwt', 'bearer'], { session: false }));

// GET - List (with Balance)
listMethod(api, 'Account', true, (req, res, accounts) => {
  async.map(accounts, (account, callback) => {
    account.getBalance((err, balance) => {
      const normalizedAccount = account.toJSON();
      normalizedAccount.balance = balance;
      callback(null, normalizedAccount);
    });
  }, (err, normalizedAccounts) => {
    res.status(200).send({ data: normalizedAccounts });
  });
});

// GET - Show (with Balance)
showMethod(api, 'Account', true, (req, res, account) => {
  account.getBalance((err, balance) => {
    const normalizedAccount = account.toJSON();
    normalizedAccount.balance = balance;
    res.status(200).send({ data: normalizedAccount });
  });
});

// Update Multiple
api.put('/', (req, res) => {
  const query = buildQuery(Account, req);
  query.user = req.user.id;
  Account.update(query, _.omit(req.body, Account.readonlyProps() || []), { multi: true }, (updateErr) => {
    if (updateErr) { return handleError(updateErr, res, 'update', 'Accounts'); }
    Account.find(query, (findErr, accounts) => {
      if (findErr) { return handleError(findErr, res, 'update', 'Accounts'); }
      res.status(200).send({
        message: `Success! Accounts updated.`,
        data: accounts
      });
    });
  });
});

api.use('/', resource('Account', true, ['create', 'update', 'delete']));

export default api;
