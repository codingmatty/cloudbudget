// import { LOGIN_USER } from '../mutation-types';
import _ from 'lodash';
import { Vue } from '../../global';

const SET_ACCOUNTS = 'SET_ACCOUNTS';
const SET_ACCOUNT = 'SET_ACCOUNT';
const REMOVE_ACCOUNT = 'REMOVE_ACCOUNT';

// initial state
export const accountsState = {
  accounts: []
};

function setAccount(state, account) {
  const localAccount = _.find(state.accountsState.accounts, { id: account.id });
  if (localAccount) {
    const index = state.accountsState.accounts.indexOf(localAccount);
    state.accountsState.accounts.splice(index, 1, account);
  } else {
    state.accountsState.accounts.push(account);
  }
}

// mutations
export const accountsMutations = {
  [SET_ACCOUNTS](state, { data: accounts }) {
    const localAccounts = _.intersectionBy(state.accountsState.accounts, accounts, 'id');
    if (localAccounts.length) {
      localAccounts.forEach(setAccount.bind(null, state));
    } else {
      state.accountsState.accounts.push(...accounts);
    }
  },
  [SET_ACCOUNT]: setAccount,
  [REMOVE_ACCOUNT](state, account) {
    const localAccount = _.find(state.accountsState.accounts, { id: account.id });
    if (localAccount) {
      const index = state.accountsState.accounts.indexOf(localAccount);
      state.accountsState.accounts.splice(index, 1);
    }
  }
};

// actions
export const accountsActions = {
  getAccounts({ dispatch }) {
    Vue.http.get('accounts').then((response) => {
      dispatch(SET_ACCOUNTS, response.data);
    });
  },
  updateAccounts({ dispatch }, accountIds, data) {
    Vue.http.put(`accounts?ids=[${accountIds.join(',') }]`, data).then((response) => {
      dispatch(SET_ACCOUNTS, response.data);
    });
  },
  createAccount({ dispatch }, accountData) {
    Vue.http.post('accounts', accountData).then((response) => {
      dispatch(SET_ACCOUNT, response.data);
    });
  },
  getAccount({ dispatch }, accountId) {
    Vue.http.get(`accounts/${accountId}`).then((response) => {
      dispatch(SET_ACCOUNT, response.data);
    });
  },
  updateAccount({ dispatch }, accountId, data) {
    Vue.http.put(`accounts/${accountId}`, data).then((response) => {
      dispatch(SET_ACCOUNT, response.data);
    });
  },
  deleteAccount({ dispatch }, accountId) {
    Vue.http.delete(`accounts/${accountId}`).then((response) => {
      dispatch(REMOVE_ACCOUNT, response.data);
    });
  }
};
