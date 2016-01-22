import _ from 'lodash';
import { Vue } from '../../../global';
import store from '../../../store';
const {
  getAccounts,
  getTransactions,
  deleteTransaction
} = store.actions;

Vue.filter('accountName', (value) => {
  return (_.find(store.state.accountsState.accounts, { id: value }) || { name: 'Unknown Account' }).name;
});

export default {
  template: require('./transaction-row.html'),
  props: {
    transaction: {
      type: Object,
      required: true
    },
    columns: {
      type: Object,
      required: true
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
      console.log(this.transaction.edit);
      this.$dispatch('edit-transaction');
    },
    deleteTransaction(transaction) {
      if (confirm('Are you sure you would like to delete this transaction?')) {
        deleteTransaction(transaction.id);
      }
    }
  }
};
