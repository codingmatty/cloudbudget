import _ from 'lodash';
import vueboot from 'vueboot';
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
    modal: vueboot.modal
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
    showModal(name) {
      this.$refs[name].showModal();
    },
    hideModal(name) {
      this.$refs[name].hideModal();
    }
  }
};
