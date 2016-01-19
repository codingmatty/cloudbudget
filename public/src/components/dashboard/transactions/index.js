import store from '../../../store';
const {
  getTransactions
} = store.actions;

export default {
  replace: false,
  template: require('./transactions.html'),
  ready() {
    getTransactions();
  },
  computed: {
    transactions() {
      return store.state.transactionsState.transactions;
    }
  }
};
