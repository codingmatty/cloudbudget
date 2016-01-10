import _ from 'lodash';
import async from 'async';
import passport from 'passport';
import { Router } from 'express';
import resource from './resource';
import { Transaction } from '../db';
import { handleError, buildQuery } from './index';

const api = new Router();
api.use(passport.authenticate(['jwt', 'bearer'], { session: false }));

api.put('/', (req, res) => {
  const query = buildQuery(Transaction, req);
  query.user = req.user.id;
  Transaction.update(query, _.omit(req.body, Transaction.readonlyProps() || []), { multi: true }, (updateErr) => {
    if (updateErr) { return handleError(updateErr, res, 'update', 'Transactions'); }
    Transaction.find(query, (findErr, transactions) => {
      if (findErr) { return handleError(findErr, res, 'update', 'Transactions'); }
      res.status(200).send({
        message: `Success! Transactions updated.`,
        data: transactions
      });
    });
  });
});

api.delete('/', (req, res) => {
  const query = buildQuery(Transaction, req);
  query.user = req.user.id;
  Transaction.find(query, (findErr, transactions) => {
    if (findErr) { return handleError(findErr, res, 'delete', 'Transactions'); }
    async.mapSeries(transactions, (transaction, callback) => {
      transaction.remove(callback);
    }, (removeErr, deletedTransactions) => {
      if (removeErr) { return handleError(removeErr, res, 'delete', 'Transactions'); }
      res.status(200).send({
        message: `Success! Transactions deleted.`,
        data: deletedTransactions
      });
    });
  });
});

api.use('/', resource('Transaction', true));

export default api;
