import _ from 'lodash';
import store from 'store';
import { Vue } from 'global';
import transactionRow from './transaction-row';
import transactionFormRow from './transaction-form-row';

import transactionsTableTemplate from './transactions-table.html';

const {
  actions: {
    getTransactions
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
      default: () => false
    },
    accountId: {},
    columns: {
      type: Object,
      default() {
        return {
          'selected': '3',
          'account': '13',
          'date': '10',
          'payee': '13',
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
  filters: {
    filterTransactions(transactions, accountId) {
      return transactions.filter((transaction) => {
        if (Array.isArray(accountId)) {
          return _.includes(accountId, transaction.account);
        } else if (accountId) {
          return transaction.account === accountId;
        }
        return true;
      });
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
      return transactionsState.transactions;
    },
    iColumns() {
      if (this.accountId && !Array.isArray(this.accountId)) {
        return {
          'selected': '3',
          'date': '13',
          'payee': '16',
          'tags': '19',
          'memo': '19',
          'amount': '9',
          'balance': '8',
          'state': '7'
        };
      }
      return this.columns;
    }
  },
  methods: {
  }
});
