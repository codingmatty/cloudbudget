import _ from 'lodash';
import store from 'config/store';
import vueboot from 'vueboot';

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

export default {
  template: accountFormModalTemplate,
  components: {
    modal: vueboot.modal
  },
  data() {
    return {
      account: {
        id: 0,
        budget: false
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
        this.account = _.merge(account);
      } else {
        this.account = {
          id: 0,
          budget: false
        };
      }
      this.$refs.modal.showModal();
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
      this.$refs.modal.hideModal();
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
};
