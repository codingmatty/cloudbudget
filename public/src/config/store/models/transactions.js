import _ from 'lodash';
import Vue from 'config/Vue';

const SET_TRANSACTIONS = 'SET_TRANSACTIONS';
const REMOVE_TRANSACTIONS = 'REMOVE_TRANSACTION';
const SET_ERRORS = 'SET_ERRORS';
const SET_TRANSACTION = 'SET_TRANSACTION';
const REMOVE_TRANSACTION = 'REMOVE_TRANSACTIONS';

// initial state
export const transactionsState = {
  transactions: [],
  errors: {}
};

function normalizeTransaction(transaction) {
  return _.merge(transaction, {
    date: new Date(transaction.date)
  });
}

function setTransaction(state, transaction) {
  const localTransaction = _.find(state.transactionsState.transactions, { id: transaction.id });
  if (localTransaction) {
    if (!_.isEqual(normalizeTransaction(transaction), localTransaction)) {
      const index = state.transactionsState.transactions.indexOf(localTransaction);
      state.transactionsState.transactions.splice(index, 1, normalizeTransaction(transaction));
    }
  } else {
    state.transactionsState.transactions.push(normalizeTransaction(transaction));
  }
}
function removeTransaction(state, transaction) {
  const localTransaction = _.find(state.transactionsState.transactions, { id: transaction.id });
  if (localTransaction) {
    const index = state.transactionsState.transactions.indexOf(localTransaction);
    state.transactionsState.transactions.splice(index, 1);
  }
}
function setErrors(state, errors, transactionId) {
  Vue.set(state.transactionsState.errors, transactionId, errors);
}

// mutations
export const transactionsMutations = {
  [SET_TRANSACTIONS](state, transactions) {
    transactions.forEach(_.partial(setTransaction, state));
  },
  [SET_TRANSACTION]: setTransaction,
  [REMOVE_TRANSACTIONS](state, transactions) {
    const localTransactions = _.intersectionBy(state.transactionsState.transactions, transactions, 'id');
    if (localTransactions.length) {
      localTransactions.forEach(_.partial(removeTransaction, state));
    }
  },
  [REMOVE_TRANSACTION]: removeTransaction,
  [SET_ERRORS](state, errors, transactionIds) {
    if (Array.isArray(transactionIds)) {
      transactionIds.forEach(_.partial(setErrors, state, errors));
    } else {
      setErrors(state, errors, transactionIds);
    }
  }
};

// actions
export const transactionsActions = {
  resetTransactionsErrors({ dispatch }, transactionId) {
    dispatch(SET_ERRORS, {}, transactionId);
  },
  getTransactions({ dispatch }) {
    return new Promise((resolve) => {
      Vue.http.get('transactions')
        .then((response) => {
          dispatch(SET_TRANSACTIONS, response.data.data);
          const deadTransactions = _.differenceBy(transactionsState.transactions, response.data.data, 'id');
          dispatch(REMOVE_TRANSACTIONS, deadTransactions);
          resolve(response.data.data);
        })
        .catch((response) => {
          resolve(response.data.errors);
        });
    });
  },
  updateTransactions({ dispatch }, transactionIds, data) {
    return new Promise((resolve) => {
      Vue.http.put(`transactions?id=[${transactionIds.join(',') }]`, data)
        .then((response) => {
          dispatch(SET_TRANSACTIONS, response.data.data);
          dispatch(SET_ERRORS, {}, transactionIds);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, transactionIds);
          resolve(response.data.errors);
        });
    });
  },
  deleteTransactions({ dispatch }, transactionIds) {
    return new Promise((resolve) => {
      Vue.http.delete(`transactions?id=[${transactionIds.join(',') }]`)
        .then((response) => {
          dispatch(REMOVE_TRANSACTIONS, response.data.data);
          dispatch(SET_ERRORS, {}, transactionIds);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, transactionIds);
          resolve(response.data.errors);
        });
    });
  },
  createTransaction({ dispatch }, transactionData) {
    return new Promise((resolve) => {
      Vue.http.post('transactions', transactionData)
        .then((response) => {
          dispatch(SET_TRANSACTION, response.data.data);
          dispatch(SET_ERRORS, {}, 0);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, 0);
          resolve(response.data.errors);
        });
    });
  },
  getTransaction({ dispatch }, transactionId) {
    return new Promise((resolve) => {
      Vue.http.get(`transactions/${transactionId}`)
        .then((response) => {
          dispatch(SET_TRANSACTION, response.data.data);
          dispatch(SET_ERRORS, {}, transactionId);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, transactionId);
          resolve(response.data.errors);
        });
    });
  },
  updateTransaction({ dispatch }, transactionId, data) {
    return new Promise((resolve) => {
      Vue.http.put(`transactions/${transactionId}`, data)
        .then((response) => {
          dispatch(SET_TRANSACTION, response.data.data);
          dispatch(SET_ERRORS, {}, transactionId);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, transactionId);
          resolve(response.data.errors);
        });
    });
  },
  deleteTransaction({ dispatch }, transactionId) {
    return new Promise((resolve) => {
      Vue.http.delete(`transactions/${transactionId}`)
        .then((response) => {
          dispatch(REMOVE_TRANSACTION, response.data.data);
          dispatch(SET_ERRORS, {}, transactionId);
          resolve(response.data.data);
        })
        .catch((response) => {
          dispatch(SET_ERRORS, response.data.errors, transactionId);
          resolve(response.data.errors);
        });
    });
  }
};
