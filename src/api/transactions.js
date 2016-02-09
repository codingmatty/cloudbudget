import _ from 'lodash';
import async from 'async';
import passport from 'passport';
import { Router } from 'express';
import resource from './resource';
import { handleError, buildQuery } from './index';
import { Transaction } from '../db';

const api = new Router();
api.use(passport.authenticate(['jwt', 'bearer'], { session: false }));

api.put('/', (req, res) => {
  const query = buildQuery(Transaction, req);
  query.user = req.user.id;
  const limit = req.query.limit;
  const skip = req.query.skip;
  const sort = req.query.sort;
  Transaction.find(query).sort(sort).skip(skip).limit(limit).then((findErr, transactions) => {
    if (findErr) { return handleError(findErr, res, 'update', 'Transactions'); }
    const updatedTransactions = transactions.map((transaction) => _.merge(transaction, Transaction.pruneReadOnlyProps(req.body)));
    async.map(updatedTransactions, (transaction, callback) => {
      transaction.save(callback);
    }, (saveErr, dbTransactions) => {
      if (saveErr) { return handleError(saveErr, res, 'delete', 'Transactions'); }
      res.status(200).send({
        message: `Success! Transactions updated.`,
        data: dbTransactions
      });
    });
  });
});

api.delete('/', (req, res) => {
  const query = buildQuery(Transaction, req);
  query.user = req.user.id;
  const limit = req.query.limit;
  const skip = req.query.skip;
  const sort = req.query.sort;
  Transaction.find(query).sort(sort).skip(skip).limit(limit).then((findErr, transactions) => {
    if (findErr) { return handleError(findErr, res, 'delete', 'Transactions'); }
    async.map(transactions, (transaction, callback) => {
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
