import _ from 'lodash';
import { Vuex } from '../global';
import { userState, userMutations, userActions } from './models/user';
import { accountsState, accountsMutations, accountsActions } from './models/accounts';

export default new Vuex.Store({
  actions: _.merge(
    userActions,
    accountsActions
  ),
  state: {
    userState,
    accountsState
  },
  mutations: [userMutations, accountsMutations]
});
