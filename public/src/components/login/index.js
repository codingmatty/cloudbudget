import store from '../../store';
const {
  actions: {
    loginUser
  },
  state: {
    userState
  }
} = store;

export default {
  template: require('./login.html'),
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
        this.$router.go('/accounts');
      });
    }
  }
};
