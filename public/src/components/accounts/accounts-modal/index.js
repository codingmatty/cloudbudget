import _ from 'lodash';
import vueboot from 'vueboot';
import store from '../../../store';
const {
  actions: {
    resetAccountsErrors,
    createAccount,
    updateAccount
  },
  state: {
    accountsState
  }
} = store;

export default {
  template: require('./accounts-modal.html'),
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
        this.account = _.merge({}, account);
      } else {
        this.account = _.merge({}, {
          id: 0,
          budget: false
        });
      }
      this.$refs.modal.showModal();
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
