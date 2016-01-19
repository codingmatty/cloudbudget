import router from '../../router';
import store from '../../store';
const {
  setUser
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
      setUser({
        user: null,
        token: ''
      });
      router.go('/login');
    }
  }
};
