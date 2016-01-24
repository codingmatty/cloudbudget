import _ from 'lodash';
import accountFormModal from './account-form-modal';
import accountGroupFormModal from './account-group-form-modal';
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
