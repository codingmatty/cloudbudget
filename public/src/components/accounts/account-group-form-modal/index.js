import _ from 'lodash';
import vueboot from 'vueboot';
import store from '../../../store';
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
  template: require('./account-group-form-modal.html'),
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
      return accountsState.errors[this.account.id] || {};
    }
  },
  methods: {
    showModal(group) {
      if (group) {
        this.group = _.merge({}, group);
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
