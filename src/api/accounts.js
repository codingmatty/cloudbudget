import async from 'async';
import { Router } from 'express';
import resource, { listMethod, showMethod } from './resource';
import { authenticate } from './index';

const api = new Router();
api.use(authenticate);

// GET - List
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

// GET - Show
showMethod(api, 'Account', true, (req, res, account) => {
  account.getBalance((err, balance) => {
    const normalizedAccount = account.toJSON();
    normalizedAccount.balance = balance;
    res.status(200).send({ data: normalizedAccount });
  });
});

api.use('/', resource('Account', true, ['create', 'update', 'delete']));

export default api;
