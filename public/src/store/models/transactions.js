// import { LOGIN_USER } from '../mutation-types';
import _ from 'lodash';
import { Vue } from '../../global';

const SET_TRANSACTIONS = 'SET_TRANSACTIONS';
const REMOVE_TRANSACTIONS = 'REMOVE_TRANSACTION';
const SET_TRANSACTION = 'SET_TRANSACTION';
const REMOVE_TRANSACTION = 'REMOVE_TRANSACTIONS';

// initial state
export const transactionsState = {
  transactions: []
};

function setTransaction(state, transaction) {
  const localTransaction = _.find(state.transactionsState.transactions, { id: transaction.id });
  if (localTransaction) {
    const index = state.transactionsState.transactions.indexOf(localTransaction);
    state.transactionsState.transactions.splice(index, 1, transaction);
  } else {
    state.transactionsState.transactions.push(transaction);
  }
}
function removeTransaction(state, transaction) {
  const localTransaction = _.find(state.transactionsState.transactions, { id: transaction.id });
  if (localTransaction) {
    const index = state.transactionsState.transactions.indexOf(localTransaction);
    state.transactionsState.transactions.splice(index, 1);
  }
}

// mutations
export const transactionsMutations = {
  [SET_TRANSACTIONS](state, { data: transactions }) {
    const localTransactions = _.intersectionBy(state.transactionsState.transactions, transactions, 'id');
    if (localTransactions.length) {
      localTransactions.forEach(setTransaction.bind(null, state));
    } else {
      state.transactionsState.transactions.push(...transactions);
    }
  },
  [REMOVE_TRANSACTIONS](state, { data: transactions }) {
    const localTransactions = _.intersectionBy(state.transactionsState.transactions, transactions, 'id');
    if (localTransactions.length) {
      localTransactions.forEach(removeTransaction.bind(null, state));
    }
  },
  [SET_TRANSACTION]: setTransaction,
  [REMOVE_TRANSACTION]: removeTransaction
};

// actions
export const transactionsActions = {
  getTransactions({ dispatch }) {
    Vue.http.get('transactions').then((response) => {
      dispatch(SET_TRANSACTIONS, response.data);
    });
  },
  updateTransactions({ dispatch }, transactionIds, data) {
    Vue.http.put(`transactions?ids=[${transactionIds.join(',') }]`, data).then((response) => {
      dispatch(SET_TRANSACTIONS, response.data);
    });
  },
  deleteTransactions({ dispatch }, transactionIds) {
    Vue.http.delete(`transactions?ids=[${transactionIds.join(',') }]`).then((response) => {
      dispatch(REMOVE_TRANSACTION, response.data);
    });
  },
  createTransaction({ dispatch }, transactionData) {
    Vue.http.post('transactions', transactionData).then((response) => {
      dispatch(SET_TRANSACTION, response.data);
    });
  },
  getTransaction({ dispatch }, transactionId) {
    Vue.http.get(`transactions/${transactionId}`).then((response) => {
      dispatch(SET_TRANSACTION, response.data);
    });
  },
  updateTransaction({ dispatch }, transactionId, data) {
    Vue.http.put(`transactions/${transactionId}`, data).then((response) => {
      dispatch(SET_TRANSACTION, response.data);
    });
  },
  deleteTransaction({ dispatch }, transactionId) {
    Vue.http.delete(`transactions/${transactionId}`).then((response) => {
      dispatch(REMOVE_TRANSACTION, response.data);
    });
  }
};
