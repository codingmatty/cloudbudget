import { Vue } from '../../global';

const SET_USER = 'SET_USER';

const initialUser = JSON.parse(localStorage.getItem('user'));
const initialToken = JSON.parse(localStorage.getItem('token')) || '';

// initial state
export const userState = {
  user: initialUser,
  token: initialToken
};

if (initialToken) {
  Vue.http.options.headers.Authorization = `JWT ${initialToken}`;
  Vue.http.get('users/info').then((response) => {
    if (response.status !== 401) {
      userState.user = response.data;
    }
  });
}

// mutations
export const userMutations = {
  [SET_USER](state, { user, token }) {
    state.userState.user = user;
    state.userState.token = token;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', JSON.stringify(token));
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
