import async from 'async';
import { Router } from 'express';
import resource, { listMethod, showMethod } from './resource';
import { authenticate } from './index';

const api = new Router();
api.use(authenticate);

// GET - List
listMethod(api, 'AccountGroup', true, (req, res, accountGroups) => {
  async.map(accountGroups, (accountGroup, callback) => {
    accountGroup.getBalance((err, balance) => {
      const normalizedAccountGroup = accountGroup.toJSON();
      normalizedAccountGroup.balance = balance;
      callback(null, normalizedAccountGroup);
    });
  }, (err, normalizedAccountGroups) => {
    res.status(200).send({ data: normalizedAccountGroups });
  });
});

// GET - Show
showMethod(api, 'AccountGroup', true, (req, res, accountGroup) => {
  accountGroup.getBalance((err, balance) => {
    const normalizedAccountGroup = accountGroup.toJSON();
    normalizedAccountGroup.balance = balance;
    res.status(200).send({ data: normalizedAccountGroup });
  });
});

api.use('/', resource('AccountGroup', true, ['create', 'update', 'remove']));

export default api;
