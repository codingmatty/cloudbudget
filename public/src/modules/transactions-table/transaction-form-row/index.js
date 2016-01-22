import _ from 'lodash';
import { Vue } from '../../../global';
import store from '../../../store';
const {
  getAccounts,
  createTransaction,
  updateTransaction
} = store.actions;

Vue.filter('amount', {
  read(value) {
    return value ? value.toFixed(2) : '';
  },
  write(val) {
    const number = +val.replace(/[^\d.]/g, '');
    return isNaN(number) ? 0 : parseFloat(number.toFixed(2));
  }
});

export default {
  template: require('./transaction-form-row.html'),
  props: {
    transaction: {
      type: Object,
      default: () => {
        console.log('test1');
        return _.merge({}, {
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
  ready() {
    console.log('test2');
    if (!store.state.accountsState.accounts.length) {
      getAccounts().then((accounts) => {
        if (this.transaction.default) {
          this.transaction.account = accounts[0].id;
          this.newTransaction.account = this.transaction.account;
        }
      });
    } else {
      if (this.transaction.default) {
        this.transaction.account = store.state.accountsState.accounts[0].id;
        this.newTransaction.account = this.transaction.account;
      }
    }
  },
  data() {
    return {
      newTransaction: _.merge({}, this.transaction)
    };
  },
  computed: {
    accounts() {
      return store.state.accountsState.accounts;
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
      this.newTransaction = _.merge({}, this.transaction);
      if (this.transaction) {
        this.transaction.edit = false;
      }
    }
  }
};
