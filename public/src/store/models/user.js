import _ from 'lodash';
import { Vue } from 'global';

const SET_USER = 'SET_USER';
const SET_ERRORS = 'SET_ERROR';

const initialToken = JSON.parse(localStorage.getItem('token')) || '';

// initial state
export const userState = {
  user: null,
  token: initialToken,
  errors: ''
};

if (initialToken) {
  Vue.http.options.headers.Authorization = `JWT ${initialToken}`;
  Vue.http.get('users/info').then((response) => {
    if (response.status !== 401) {
      userState.user = response.data;
      Vue.http.options.headers.Authorization = `JWT ${initialToken}`;
    }
  }, () => {
    localStorage.setItem('token', JSON.stringify(''));
    Vue.http.options.headers.Authorization = ``;
    userState.token = '';
  });
}

// mutations
export const userMutations = {
  [SET_USER](state, { user, token }) {
    state.userState.user = user;
    state.userState.token = token;
    localStorage.setItem('token', JSON.stringify(token || ''));
    if (token) {
      Vue.http.options.headers.Authorization = `JWT ${token}`;
    } else {
      Vue.http.options.headers.Authorization = ``;
    }
  },
  [SET_ERRORS](state, errors) {
    state.userState.errors = errors;
  }
};

// actions
export const userActions = {
  loginUser({ dispatch }, username, password) {
    return new Promise((resolve) => {
      const errors = {};
      if (!username) { errors.username = 'required'; }
      if (!password) { errors.password = 'required'; }
      if (!_.isEmpty(errors)) {
        dispatch(SET_ERRORS, errors);
        return resolve(errors);
      }
      Vue.http.post('users/login', {
        username,
        password
      }).then((response) => {
        dispatch(SET_USER, { user: response.data.data, token: response.data.token });
        dispatch(SET_ERRORS, {});
        resolve(response.data.data);
      }).catch((response) => {
        dispatch(SET_USER, { user: null, token: '' });
        if (response.status === 401) {
          dispatch(SET_ERRORS, { message: 'Invalid Username or Password.' });
        } else {
          dispatch(SET_ERRORS, { message: 'Unknown Error.' });
        }
        resolve(response.data.errors);
      });
    });
  },
  logoutUser({ dispatch }) {
    return new Promise((resolve) => {
      Vue.http.get('users/logout')
        .then(() => {
          dispatch(SET_USER, {});
          dispatch(SET_ERRORS, {});
          resolve();
        })
        .catch(() => {
          dispatch(SET_USER, {});
          dispatch(SET_ERRORS, {});
          resolve();
        });
    });
  }
};
