import _ from 'lodash';
import vueboot from 'vueboot';
import store from '../../../store';
const {
  actions: {
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
  props: {
    account: {
      type: Object,
      default: () => {
        return _.merge({}, {
          id: 0,
          budget: false
        });
      }
    }
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
    showModal() {
      this.$refs.modal.showModal();
    },
    closeModal() {
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
