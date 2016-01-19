import { Vue } from '../../global';

const SET_USER = 'SET_USER';

// initial state
export const userState = {
  user: null,
  token: ''
};

// mutations
export const userMutations = {
  [SET_USER](state, { user, token }) {
    state.userState.user = user;
    state.userState.token = token;
    if (token) {
      Vue.http.options.headers.Authorization = `JWT ${token}`;
    }
  }
};

// actions
export const userActions = {
  setUser({ dispatch }, userData) {
    dispatch(SET_USER, userData);
  }
};
