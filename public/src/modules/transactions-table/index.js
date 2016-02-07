import _ from 'lodash';
import Vue from 'config';
import store from 'config/store';
import { screenSize } from 'modules/services';
import transactionRow from './transaction-row';
import transactionFormRow from './transaction-form-row';

import transactionsTableTemplate from './transactions-table.html';

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

Vue.component('transactions-table', {
  template: transactionsTableTemplate,
  props: {
    includeForm: {
      type: Boolean,
      default: () => false,
      coerce(val) {
        return val && screenSize.testSize('md', 'up');
      }
    },
    accountId: {
      type: String,
      default() { return this.$route.query.account_id; }
    },
    balance: {
      type: Number
    },
    columns: {
      type: Object,
      default() {
        return {
          'selected': '5',
          'account': '12',
          'date': '10',
          'payee': '12',
          'tags': '16',
          'memo': '16',
          'amount': '8',
          'balance': '8',
          'state': '7'
        };
      },
      validator: (valueObj) => {
        if (_.sum(_.values(valueObj)) !== 94) {
          return false;
        }
        return true;
      }
    }
  },
  components: {
    transactionRow,
    transactionFormRow
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

      return _.orderBy(transactions, ['date', 'amount'], ['desc', 'desc']);
    },
    transactionBalances() {
      const balances = {};
      let currentBalance = this.balance;
      this.transactions.forEach((transaction) => {
        balances[transaction.id] = currentBalance;
        currentBalance -= transaction.amount;
      });
      return balances;
    },
    iColumns() {
      if (this.accountId && !Array.isArray(this.accountId)) {
        return {
          'selected': '5',
          'date': '13',
          'payee': '16',
          'tags': '18',
          'memo': '18',
          'amount': '9',
          'balance': '8',
          'state': '7'
        };
      }
      return this.columns;
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
