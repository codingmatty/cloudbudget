import store from 'config/store';

import userTemplate from './user.html';

const {
  state: {
    userState
  }
} = store;

export default {
  template: userTemplate,
  computed: {
    user() {
      return userState.user;
    }
  }
};
