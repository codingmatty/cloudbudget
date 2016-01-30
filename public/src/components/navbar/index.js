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

export default {
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
};
