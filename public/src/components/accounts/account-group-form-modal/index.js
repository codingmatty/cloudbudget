import _ from 'lodash';
import store from 'config/store';
import vueboot from 'vueboot';

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

export default {
  template: accountGroupFormModalTemplate,
  components: {
    modal: vueboot.modal
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
        this.group = _.merge(group);
        this.$refs.modal.showModal();
      }
    },
    closeModal() {
      this.group.accounts.forEach(account => resetAccountsErrors(account.id));
      this.$refs.modal.hideModal();
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
};
