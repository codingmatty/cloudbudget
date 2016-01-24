import _ from 'lodash';
import accountsModal from './accounts-modal';
import { Vue } from '../../global';
import store from '../../store';
const {
  actions: {
    getAccounts
  },
  state: {
    accountsState
  }
} = store;

export default {
  template: require('./accounts.html'),
  components: {
    accountsModal
  },
  ready() {
    getAccounts();
  },
  data() {
    return {
    };
  },
  computed: {
    accounts() {
      return accountsState.accounts;
    },
    groups() {
      const groups = [];
      const groupsObj = _.groupBy(this.accounts, 'group');
      for (const groupName in groupsObj) {
        if (groupsObj.hasOwnProperty(groupName)) {
          groups.push({
            name: groupName,
            balance: _.sumBy(groupsObj[groupName], 'balance'),
            accounts: groupsObj[groupName]
          });
        }
      }
      return groups;
    }
  },
  methods: {
    newAccount() {
      this.$refs.modal.showModal(null);
    },
    editAccount(account) {
      this.$refs.modal.showModal(account);
    },
    showEdit(account) {
      Vue.set(account, 'displayEdit', true);
    },
    hideEdit(account) {
      Vue.set(account, 'displayEdit', false);
    }
  }
};
