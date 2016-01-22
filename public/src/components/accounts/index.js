import _ from 'lodash';
import store from '../../store';
const {
  getAccounts
} = store.actions;

export default {
  template: require('./accounts.html'),
  ready() {
    getAccounts();
  },
  data() {
    return {
    };
  },
  computed: {
    accounts() {
      console.log('accounts updated');
      return store.state.accountsState.accounts;
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
      console.log('groups updated ' + JSON.stringify(groups, null, 2));
      return groups;
    }
  },
  methods: {
  }
};
