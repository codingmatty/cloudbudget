import _ from 'lodash';
import store from '../../../store';
const {
  actions: {
    resetTransactionsErrors,
    getAccounts,
    createTransaction,
    updateTransaction
  },
  state: {
    accountsState,
    transactionsState
  }
} = store;

export default {
  template: require('./transaction-form-row.html'),
  props: {
    transaction: {
      type: Object,
      default: () => {
        return _.merge({}, {
          id: 0,
          date: Date.now(),
          state: 'none',
          default: true
        });
      }
    },
    columns: {
      type: Object,
      required: true
    },
    clearTransaction: {
      type: Function
    }
  },
  filters: {
    amount: {
      read(value) {
        return value ? value.toFixed(2) : '';
      },
      write(val) {
        const number = +val.replace(/[^\d.]/g, '');
        return isNaN(number) ? 0 : parseFloat(number.toFixed(2));
      }
    }
  },
  ready() {
    getAccounts().then((accounts) => {
      if (this.transaction.default) {
        this.transaction.account = _.head(accounts).id;
        this.newTransaction.account = this.transaction.account;
      }
    });
  },
  data() {
    return {
      newTransaction: _.merge({}, this.transaction)
    };
  },
  computed: {
    accounts() {
      return accountsState.accounts;
    },
    errors() {
      return transactionsState.errors[this.transaction.id] || {};
    }
  },
  methods: {
    saveTransaction(newTransaction) {
      if (newTransaction.id) {
        updateTransaction(newTransaction.id, newTransaction);
      } else {
        createTransaction(newTransaction);
        this.newTransaction = _.merge({}, this.transaction);
      }
    },
    resetTransaction() {
      resetTransactionsErrors(this.newTransaction.id);
      this.newTransaction = _.merge({}, this.transaction);
      if (this.transaction) {
        this.transaction.edit = false;
      }
    }
  }
};
