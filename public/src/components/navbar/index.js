import Vue from 'config';
import store from 'config/store';
import navbarTemplate from './navbar.html';

const {
  actions: {
    logoutUser
  },
  state: {
    userState
  }
} = store;

Vue.component('navbar', {
  template: navbarTemplate,
  computed: {
    user() {
      return userState.user;
    }
  },
  methods: {
    logoutUser() {
      logoutUser().then(() => {
        this.$router.go('/login');
      });
    }
  }
});
