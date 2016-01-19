import store from '../../store';
const {
  getAccounts
} = store.actions;

export default {
  template: require('./dashboard.html'),
  ready() {
    getAccounts();
  },
  computed: {
    accounts() {
      return store.state.accountsState.accounts;
    }
  }
};
