import _ from 'lodash';
import store from 'store';

import transactionRowTemplate from './transaction-row.html';

const {
  actions: {
    getAccounts,
    getTransactions,
    deleteTransaction
  },
  state: {
    accountsState
  }
} = store;

export default {
  template: transactionRowTemplate,
  props: {
    transaction: {
      type: Object,
      required: true
    },
    columns: {
      type: Object,
      required: true
    },
    balance: {
      type: Number
    }
  },
  filters: {
    accountName(value) {
      return (_.find(accountsState.accounts, { id: value }) || { name: 'Unknown Account' }).name;
    }
  },
  ready() {
    getAccounts();
    getTransactions();
  },
  data() {
    return {
    };
  },
  computed: {
  },
  methods: {
    editTransaction() {
      this.$set('transaction.edit', true);
      this.$dispatch('edit-transaction');
    },
    deleteTransaction(transaction) {
      if (confirm('Are you sure you would like to delete this transaction?')) {
        deleteTransaction(transaction.id).then(() => {
          getAccounts();
        });
      }
    }
  }
};
