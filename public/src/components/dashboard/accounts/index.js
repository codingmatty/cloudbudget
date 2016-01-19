import _ from 'lodash';
import store from '../../../store';
const {
  getAccounts
} = store.actions;

export default {
  replace: false,
  template: require('./accounts.html'),
  components: {
  },
  ready() {
    getAccounts();
  },
  methods: {
  },
  computed: {
    accounts() {
      return store.state.accountsState.accounts;
    },
    groups() {
      return _.groupBy(store.state.accountsState.accounts, 'group');
    }
  }
};
