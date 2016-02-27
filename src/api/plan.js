import _ from 'lodash';
import async from 'async';
import moment from 'moment';
import passport from 'passport';
import { Router } from 'express';
import resource from './resource';
import { buildQuery, handleError } from './index';
import { Plan, Schedule, Transaction } from '../db';

const api = new Router();
api.use(passport.authenticate(['jwt', 'bearer'], { session: false }));

// Update Multiple
api.get('/', (req, res) => {
  const start = moment('2016-01-10').startOf('month');
  const end = moment('2016-01-10').endOf('month');
  const transactionQuery = {
    date: {
      $gte: new Date(2016, 0, 1),
      $lte: new Date(2016, 0, 29)
    }
  };
  const scheduleQuery = {
    transaction: transactionQuery
  };
  const processPlan = (plan) => {
    async.parallel([(callback) => {
      // fetch income transactions that have already been registered.
      Transaction.find({ tags: 'Plan: Income' }).where('date').gte(start.toDate()).lte(end.toDate()).exec((err, transactions) => {
        if (err) return callback(err);
        callback(null, _.sumBy(transactions, 'amount'));
      });
    }, (callback) => {
      // fetch scheduled income transactions
      Schedule.find({ _id: { $in: plan.income } }).where('transaction.date').gte(start.toDate()).lte(end.toDate()).exec((err, schedules) => {
        if (err) return callback(err);
        callback(null, _.sumBy(schedules, 'transaction.amount'));
      });
    }, (callback) => {
      // fetch bill transactions that have already been registered.
      Transaction.find({ tags: 'Plan: Bill' }).where('date').gte(start.toDate()).lte(end.toDate()).exec((err, transactions) => {
        if (err) return callback(err);
        callback(null, _.sumBy(transactions, 'amount'));
      });
    }, (callback) => {
      // fetch scheduled bill transactions
      Schedule.find({ _id: { $in: plan.bills } }).where('transaction.date').gte(start.toDate()).lte(end.toDate()).exec((err, schedules) => {
        if (err) return callback(err);
        callback(null, _.sumBy(schedules, 'transaction.amount'));
      });
    }, (callback) => {
      // fetch regular transactions that have already been registered.
      Transaction.find({ tags: 'Plan: Regular' }).where('date').gte(start.toDate()).lte(end.toDate()).exec((err, transactions) => {
        if (err) return callback(err);
        callback(null, _.sumBy(transactions, 'amount'));
      });
    }], (err, results) => {
      if (err) return handleError(err, res, 'Get', 'Plan');
      const incomeBalance = results[0] + results[1];
      const billsBalance = results[2] + results[3];
      const regularBalance = results[4];
      const remainingBalance = incomeBalance - billsBalance - plan.savings - regularBalance;
      console.log({
        incomeBalance,
        billsBalance,
        regularBalance,
        remainingBalance
      }, plan, _.merge({
        incomeBalance,
        billsBalance,
        regularBalance,
        remainingBalance
      }, plan.toJSON()));
      res.status(200).send(_.merge({
        incomeBalance,
        billsBalance,
        regularBalance,
        remainingBalance
      }, plan.toJSON()));
    });
  };
  Plan.findOne((planErr, plan) => {
    if (planErr) return handleError(planErr, res, 'Get', 'Plan');
    if (!plan) {
      return Plan.create({ user: req.user }, (err, newPlan) => {
        if (err) handleError(err, res, 'Get', 'Plan');
        processPlan(newPlan);
      });
    }
    processPlan(plan);
  });
});

api.use('/', resource('Plan'));

export default api;
