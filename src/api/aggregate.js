import _ from 'lodash';
import async from 'async';
import passport from 'passport';
import { Router } from 'express';
import { buildQuery } from './index';
import { Account, Transaction } from '../db';

const compareStrings = (a, b) => (+(a.toLowerCase() > b.toLowerCase()) || +(a.toLowerCase() === b.toLowerCase() && b > a) || +(a.toLowerCase() === b.toLowerCase()) - 1);

const api = new Router();
api.use(passport.authenticate(['jwt', 'bearer'], { session: false }));

api.get('/tags', (req, res) => {
  const query = buildQuery(Transaction, req);
  query.user = req.user.id;
  Transaction.find(query).select('tags').then((transactions) => {
    const tags = _.chain(transactions)
      .map('tags')
      .flatten()
      .concat('Plan: Income', 'Plan: Bill', 'Plan: Regular')
      .uniq()
      .compact()
      .value();
    tags.sort(compareStrings);
    res.status(200).send({
      data: tags
    });
  });
});

api.get('/payees', (req, res) => {
  const query = buildQuery(Transaction, req);
  query.user = req.user.id;
  async.waterfall([
    (callback) => {
      Transaction.find(query).select('payee account').then((transactions) => {
        const groups = _.groupBy(transactions, 'account');
        const payees = {};
        _.forOwn(groups, (group, accountId) => {
          payees[accountId] = _.chain(group).map('payee').uniq().compact().value();
        });
        callback(null, payees);
      });
    },
    (payees, callback) => {
      Account.find({}, (err, accounts) => {
        const accountNames = _.map(accounts, account => `Transfer: ${account.name}`);
        _.forEach(accounts, (account) => {
          payees[account.id] = (payees[account.id] || []).concat(_.without(accountNames, `Transfer: ${account.name}`)).sort(compareStrings);
          switch (account.type) {
            case 'savings':
            case 'checking':
            case 'credit_card':
            case 'loan':
              payees[account.id] = payees[account.id].concat(['Interest', 'Fee']);
              break;
            case 'asset':
              payees[account.id] = payees[account.id].concat(['Appreciation', 'Depretiation']);
              break;
            case 'investment':
              payees[account.id] = payees[account.id].concat(['Gain', 'Loss', 'Dividends']);
              break;
            default: break;
          }
          payees[account.id].sort(compareStrings);
        });
        callback(null, payees);
      });
    },
  ], (err, payees) => {
    res.status(200).send({
      data: payees
    });
  });
});

export default api;
