import _ from 'lodash';
// import Vue from 'config';
import store from 'config/store';

import transactionsTemplate from './transactions.html';

const {
  actions: {
    getAccounts
  },
  state: {
    accountsState
  }
} = store;

export default {
  template: transactionsTemplate,
  components: {
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
      _.forOwn(groupsObj, (group, groupName) => {
        groups.push({
          id: groupName.replace(/[^\w\d]/g, '').toLowerCase(),
          name: groupName,
          balance: _.sumBy(groupsObj[groupName], 'balance'),
          accounts: groupsObj[groupName]
        });
      });
      return groups;
    },
    totalBalance() {
      return _.sumBy(this.groups, 'balance');
    },
    transactionAccountId() {
      const group = _.find(this.groups, { id: this.$route.query.account_id });
      if (group) {
        return _.map(group.accounts, 'id');
      }
      return this.$route.query.account_id || '';
    },
    transactionBalance() {
      const group = _.find(this.groups, { id: this.$route.query.account_id });
      if (group) {
        return group.balance;
      }
      const account = _.find(this.accounts, { id: this.$route.query.account_id });
      if (account) {
        return account.balance;
      }
      return this.totalBalance || 0;
    }
  },
  methods: {
  }
};
