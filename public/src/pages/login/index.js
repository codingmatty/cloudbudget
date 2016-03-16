import store from 'config/store';

import loginTemplate from './login.html';

const {
  actions: {
    loginUser
  },
  state: {
    userState
  }
} = store;

export default {
  template: loginTemplate,
  data() {
    return {
      username: '',
      password: ''
    };
  },
  computed: {
    errors() {
      return userState.errors;
    }
  },
  methods: {
    loginUser(username, password) {
      loginUser(
        username,
        password
      ).then(() => {
        this.$router.go({ name: 'dashboard' });
      });
    }
  }
};
