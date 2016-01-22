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
  [SET_ACCOUNTS](state, accounts) {
    const remoteAccounts = _.intersectionBy(accounts, state.accountsState.accounts, 'id');
    _.forOwn(remoteAccounts, (value, key) => {
      if (_.isEqual(value, state.transactionsState.transactions[key])) {
        delete remoteAccounts[key];
      }
    });
    if (remoteAccounts.length) {
      remoteAccounts.forEach(setAccount.bind(null, state));
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
    return new Promise((resolve, reject) => {
      Vue.http.get('accounts').then((response) => {
        dispatch(SET_ACCOUNTS, response.data.data);
        resolve(response.data.data);
      }).catch(reject);
    });
  },
  updateAccounts({ dispatch }, accountIds, data) {
    return new Promise((resolve, reject) => {
      Vue.http.put(`accounts?ids=[${accountIds.join(',') }]`, data).then((response) => {
        dispatch(SET_ACCOUNTS, response.data.data);
        resolve(response.data.data);
      }).catch(reject);
    });
  },
  createAccount({ dispatch }, accountData) {
    return new Promise((resolve, reject) => {
      Vue.http.post('accounts', accountData).then((response) => {
        dispatch(SET_ACCOUNT, response.data.data);
        resolve(response.data.data);
      }).catch(reject);
    });
  },
  getAccount({ dispatch }, accountId) {
    return new Promise((resolve, reject) => {
      Vue.http.get(`accounts/${accountId}`).then((response) => {
        dispatch(SET_ACCOUNT, response.data.data);
        resolve(response.data.data);
      }).catch(reject);
    });
  },
  updateAccount({ dispatch }, accountId, data) {
    return new Promise((resolve, reject) => {
      Vue.http.put(`accounts/${accountId}`, data).then((response) => {
        dispatch(SET_ACCOUNT, response.data.data);
        resolve(response.data.data);
      }).catch(reject);
    });
  },
  deleteAccount({ dispatch }, accountId) {
    return new Promise((resolve, reject) => {
      Vue.http.delete(`accounts/${accountId}`).then((response) => {
        dispatch(REMOVE_ACCOUNT, response.data.data);
        resolve(response.data.data);
      }).catch(reject);
    });
  }
};
