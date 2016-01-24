// import { LOGIN_USER } from '../mutation-types';
import _ from 'lodash';
import { Vue } from '../../global';

const SET_ACCOUNTS = 'SET_ACCOUNTS';
const SET_ACCOUNT = 'SET_ACCOUNT';
const REMOVE_ACCOUNT = 'REMOVE_ACCOUNT';
const SET_ERRORS = 'SET_ERRORS';

// initial state
export const accountsState = {
  accounts: [],
  errors: {}
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
function setErrors(state, errors, accountId) {
  Vue.set(state.accountsState.errors, accountId, errors);
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
  },
  [SET_ERRORS](state, errors, accountIds) {
    if (Array.isArray(accountIds)) {
      accountIds.forEach(setErrors.bind(null, state, errors));
    } else {
      setErrors(state, errors, accountIds);
    }
  }
};

// actions
export const accountsActions = {
  resetAccountsErrors({ dispatch }, accountId) {
    dispatch(SET_ERRORS, {}, accountId);
  },
  getAccounts({ dispatch }) {
    return new Promise((resolve) => {
      Vue.http.get('accounts')
        .then((response) => {
          dispatch(SET_ACCOUNTS, response.data.data);
          resolve(response.data.data);
        }).catch((response) => {
          resolve(response.data.errors);
        });
    });
  },
  updateAccounts({ dispatch }, accountIds, data) {
    return new Promise((resolve) => {
      Vue.http.put(`accounts?id=[${accountIds.join(',') }]`, data)
        .then((response) => {
          dispatch(SET_ACCOUNTS, response.data.data);
          dispatch(SET_ERRORS, {}, accountIds);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, accountIds);
          resolve(response.data.errors);
        });
    });
  },
  createAccount({ dispatch }, accountData) {
    return new Promise((resolve) => {
      Vue.http.post('accounts', accountData)
        .then((response) => {
          dispatch(SET_ACCOUNT, response.data.data);
          dispatch(SET_ERRORS, {}, 0);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, 0);
          resolve(response.data.errors);
        });
    });
  },
  getAccount({ dispatch }, accountId) {
    return new Promise((resolve) => {
      Vue.http.get(`accounts/${accountId}`)
        .then((response) => {
          dispatch(SET_ACCOUNT, response.data.data);
          dispatch(SET_ERRORS, {}, accountId);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, accountId);
          resolve(response.data.errors);
        });
    });
  },
  updateAccount({ dispatch }, accountId, data) {
    return new Promise((resolve) => {
      Vue.http.put(`accounts/${accountId}`, data)
        .then((response) => {
          dispatch(SET_ACCOUNT, response.data.data);
          dispatch(SET_ERRORS, {}, accountId);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, accountId);
          resolve(response.data.errors);
        });
    });
  },
  deleteAccount({ dispatch }, accountId) {
    return new Promise((resolve) => {
      Vue.http.delete(`accounts/${accountId}`)
        .then((response) => {
          dispatch(REMOVE_ACCOUNT, response.data.data);
          dispatch(SET_ERRORS, {}, accountId);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, accountId);
          resolve(response.data.errors);
        });
    });
  }
};
