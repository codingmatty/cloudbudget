import _ from 'lodash';
import Vue from 'config';
import store from 'config/store';
import vuestrapBase from 'vuestrap-base-components';

import accountGroupFormModalTemplate from './account-group-form-modal.html';

const {
  actions: {
    resetAccountsErrors,
    updateAccounts
  },
  state: {
    accountsState
  }
} = store;

Vue.component('account-group-form-modal', {
  template: accountGroupFormModalTemplate,
  components: {
    vsModal: vuestrapBase.modal
  },
  data() {
    return {
      group: {}
    };
  },
  computed: {
    errors() {
      return this.group.accounts ? accountsState.errors[_.head(this.group.accounts).id] || {} : {};
    }
  },
  methods: {
    showModal(group) {
      if (group) {
        this.group = _.cloneDeep(group);
        this.$refs.modal.show();
      }
    },
    closeModal() {
      this.group.accounts.forEach(account => resetAccountsErrors(account.id));
      this.$refs.modal.hide();
    },
    saveGroup(group) {
      updateAccounts(_.map(group.accounts, 'id'), { group: group.name }).then((data) => {
        if (Array.isArray(data) && _.compact(_.map(data, 'id')).length === data.length) {
          // make sure all accounts that have been updated don't have errors.
          this.closeModal();
        }
      });
    }
  }
});
