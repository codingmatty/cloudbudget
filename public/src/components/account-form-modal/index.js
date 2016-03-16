import _ from 'lodash';
import Vue from 'config';
import store from 'config/store';
import vuestrapBase from 'vuestrap-base-components';

import accountFormModalTemplate from './account-form-modal.html';

const {
  actions: {
    getTransactions,
    resetAccountsErrors,
    deleteAccount,
    createAccount,
    updateAccount
  },
  state: {
    accountsState
  }
} = store;

Vue.component('account-form-modal', {
  template: accountFormModalTemplate,
  components: {
    vsModal: vuestrapBase.modal
  },
  data() {
    return {
      account: {
        id: 0,
        budget: false,
        type: 'default'
      }
    };
  },
  computed: {
    groups() {
      return _.uniq(_.map(accountsState.accounts, 'group'));
    },
    errors() {
      return accountsState.errors[this.account.id] || {};
    }
  },
  methods: {
    showModal(account) {
      if (account) {
        this.account = _.cloneDeep(account);
      } else {
        this.account = {
          id: 0,
          budget: false,
          type: 'default'
        };
      }
      this.$refs.modal.show();
    },
    deleteAccount(account) {
      if (confirm(`Are you sure you would like to delete account ${account.name}?\nAll transactions assoicated with account will be deleted.`)) {
        deleteAccount(account.id).then((data) => {
          if (data.id) {
            getTransactions();
            this.closeModal();
          }
        });
      }
    },
    closeModal() {
      resetAccountsErrors(this.account.id);
      this.$refs.modal.hide();
    },
    saveAccount(account) {
      const completeSave = (data) => {
        if (data.id) {
          this.closeModal();
        }
      };
      if (account.id) {
        updateAccount(account.id, account).then(completeSave);
      } else {
        createAccount(account).then(completeSave);
      }
    }
  }
});
