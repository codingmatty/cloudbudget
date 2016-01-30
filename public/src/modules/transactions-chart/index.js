import _ from 'lodash';
import moment from 'moment';
import Vue from 'config';
import store from 'config/store';

import transactionsChartTemplate from './transactions-chart.html';

const {
  actions: {
    getAccounts,
    getTransactions,
    updateTransactions,
    deleteTransactions
  },
  state: {
    transactionsState
  }
} = store;

Vue.component('transactions-chart', {
  template: transactionsChartTemplate,
  props: {
    includeForm: {
      type: Boolean,
      default: () => false
    },
    accountId: {},
    balance: {
      type: Number
    }
  },
  ready() {
    getTransactions();
  },
  data() {
    return {
    };
  },
  computed: {
    transactions() {
      const transactions = transactionsState.transactions.filter((transaction) => {
        if (Array.isArray(this.accountId)) {
          return _.includes(this.accountId, transaction.account);
        } else if (this.accountId) {
          return transaction.account === this.accountId;
        }
        return true;
      });

      return _.orderBy(transactions, 'date', 'asc');
    },
    columns() {
      const dates = ['date'];
      const balances = ['balance'];
      let currentBalance = 0;
      const groupedTransactions = _.groupBy(this.transactions, 'date');
      _.forEach(groupedTransactions, (transactions, date) => {
        dates.push(moment(new Date(date)).utc().format('YYYY-MM-DD'));
        currentBalance += _.sumBy(transactions, 'amount');
        balances.push(currentBalance);
      });
      return [
        dates,
        balances
      ];
    },
    data() {
      return {
        names: {
          balance: 'Balance'
        },
        types: {
          balance: 'area-spline'
        },
        x: 'date',
        columns: this.columns
      };
    },
    axis() {
      return {
        x: {
          type: 'timeseries',
          tick: {
            format: '%m/%d/%Y'
          }
        },
        y: {
          tick: {
            format(value) {
              return Vue.filter('cbCurrency')(value);
            }
          }
        }
      };
    }
  },
  methods: {
    clearTransactions() {
      const transactionsToUpdate = _.filter(this.transactions, { 'selected': true });
      updateTransactions(_.map(transactionsToUpdate, 'id'), { state: 'cleared' })
        .then(() => {
          getAccounts();
        });
    },
    deleteTransactions() {
      const transactionsToDelete = _.filter(this.transactions, { 'selected': true });
      if (confirm(`Are you sure you would like to delete ${transactionsToDelete.length} transactions?`)) {
        deleteTransactions(_.map(transactionsToDelete, 'id'))
          .then(() => {
            getAccounts();
          });
      }
    }
  }
});
