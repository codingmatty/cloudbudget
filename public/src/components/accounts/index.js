import _ from 'lodash';
import Vue from 'config';
import store from 'config/store';
import accountFormModal from './account-form-modal';
import accountGroupFormModal from './account-group-form-modal';

import accountsTemplate from './accounts.html';

const {
  actions: {
    getAccounts
  },
  state: {
    accountsState
  }
} = store;

export default {
  template: accountsTemplate,
  components: {
    accountFormModal,
    accountGroupFormModal
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
            id: groupName.replace(/[^\w\d]/g, '').toLowerCase(),
            name: groupName,
            balance: _.sumBy(groupsObj[groupName], 'balance'),
            accounts: groupsObj[groupName]
          });
        }
      }
      return groups;
    },
    totalBalance() {
      return _.sumBy(this.groups, 'balance');
    },
    transactionAccountId() {
      const group = _.find(this.groups, { id: this.$route.params.account_id });
      if (group) {
        return _.map(group.accounts, 'id');
      }
      return this.$route.params.account_id || '';
    },
    transactionBalance() {
      const group = _.find(this.groups, { id: this.$route.params.account_id });
      if (group) {
        return group.balance;
      }
      const account = _.find(this.accounts, { id: this.$route.params.account_id });
      if (account) {
        return account.balance;
      }
      return this.totalBalance || 0;
    }
  },
  methods: {
    newAccount() {
      this.$refs.accountFormModal.showModal(null);
    },
    editAccount(account) {
      this.$refs.accountFormModal.showModal(account);
    },
    editGroup(group) {
      this.$refs.groupFormModal.showModal(group);
    },
    showEdit(accountOrGroup) {
      Vue.set(accountOrGroup, 'displayEdit', true);
    },
    hideEdit(accountOrGroup) {
      Vue.set(accountOrGroup, 'displayEdit', false);
    }
  }
};
