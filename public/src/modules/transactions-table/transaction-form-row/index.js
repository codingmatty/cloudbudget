import _ from 'lodash';
import moment from 'moment';
import store from 'config/store';

import transactionFormRowTemplate from './transaction-form-row.html';

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
  template: transactionFormRowTemplate,
  props: {
    defaultAccountId: {},
    transaction: {
      type: Object,
      default() {
        return {
          id: 0,
          date: moment().format('YYYY-MM-DD'),
          state: 'pending',
          default: true
        };
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
        const number = +val.replace(/[^\d.-]/g, '');
        return isNaN(number) ? 0 : parseFloat(number.toFixed(2));
      }
    }
  },
  ready() {
    getAccounts();
  },
  watch: {
    ['defaultAccountId'](value) {
      if (this.transaction.default) {
        if (!value) {
          this.transaction.account = _.head(this.accounts).id;
        } else {
          if (Array.isArray(value)) {
            this.transaction.account = _.head(value);
          } else {
            this.transaction.account = value;
          }
        }
        this.formTransaction.account = this.transaction.account;
      }
    }
  },
  data() {
    return {
      formTransaction: _.cloneDeep(this.transaction)
    };
  },
  computed: {
    accounts() {
      const accounts = accountsState.accounts;
      if (this.transaction.default && accounts && accounts.length) {
        this.transaction.account = _.head(accounts).id;
        this.formTransaction.account = this.transaction.account;
      }
      return accounts;
    },
    errors() {
      return transactionsState.errors[this.transaction.id] || {};
    },
    payees() {
      return _.uniq(_.map(transactionsState.transactions, 'payee'));
    },
    tags() {
      return _.uniq(_.compact(_.flatten(_.map(transactionsState.transactions, 'tags'))));
    }
  },
  methods: {
    saveTransaction(formTransaction) {
      if (formTransaction.id) {
        updateTransaction(formTransaction.id, formTransaction);
      } else {
        createTransaction(formTransaction);
        this.formTransaction = _.cloneDeep(this.transaction);
      }
    },
    resetTransaction() {
      resetTransactionsErrors(this.formTransaction.id);
      this.formTransaction = _.cloneDeep(this.transaction);
      if (this.transaction) {
        this.transaction.edit = false;
      }
    }
  }
};
