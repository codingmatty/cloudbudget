import store from '../../store';

const {
  logoutUser
} = store.actions;

export default {
  template: require('./navbar.html'),
  computed: {
    user() {
      return store.state.userState.user;
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
