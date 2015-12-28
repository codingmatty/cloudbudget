import _ from 'lodash';
import async from 'async';
import { Router } from 'express';
import resource from './resource';
import { Account } from '../db';
import { handleError, getInclusions, authenticate } from './index';

const api = new Router();
api.use(authenticate);

// GET - List
api.get('/', (req, res) => {
  Account.find({ user: req.user.id }).populate(getInclusions(req)).exec((queryErr, accounts) => {
    if (queryErr) {
      handleError(queryErr, res, 'list', 'Account');
    } else {
      async.map(accounts, (account, cb) => {
        account.getBalance((balance) => {
          const normalizedAccount = account.toJSON();
          normalizedAccount.balance = balance;
          cb(null, normalizedAccount);
        });
      }, (err, normalizedAccounts) => {
        res.status(200).send({ data: normalizedAccounts });
      });
    }
  });
});

// GET - Show
api.get('/:id', (req, res) => {
  const query = { _id: req.params.id, user: req.user.id };
  Account.findOne(query).populate(getInclusions(req)).exec((err, account) => {
    if (err) {
      handleError(err, res, 'show', 'Account');
    } else {
      account.getBalance((balance) => {
        const normalizedAccount = account.toJSON();
        normalizedAccount.balance = balance;
        res.status(200).send({ data: normalizedAccount });
      });
    }
  });
});

api.use('/', resource('Account', true, ['create', 'update', 'remove']));

export default api;
