import _ from 'lodash';
import { Vuex } from '../global';
import { userState, userMutations, userActions } from './models/user';
import { accountsState, accountsMutations, accountsActions } from './models/accounts';
import { transactionsState, transactionsMutations, transactionsActions } from './models/transactions';

export default new Vuex.Store({
  actions: _.merge(
    userActions,
    accountsActions,
    transactionsActions
  ),
  state: {
    userState,
    accountsState,
    transactionsState
  },
  mutations: [userMutations, accountsMutations, transactionsMutations]
});
