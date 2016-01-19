import { Vue } from '../../global';
import router from '../../router';
import store from '../../store';
const {
  setUser
} = store.actions;

export default {
  template: require('./login.html'),
  data() {
    return {
      username: '',
      password: '',
      error: null
    };
  },
  methods: {
    loginUser(username, password) {
      return Vue.http.post('users/login', {
        username,
        password
      }).then((response) => {
        setUser({
          user: response.data.data,
          token: response.data.token
        });
        router.go('/');
      }).catch((response) => {
        setUser({
          user: null,
          token: ''
        });
        if (response.status === 401) {
          this.error = 'Invalid Username or Password.';
        } else {
          this.error = 'Unknown Error.';
        }
      });
    }
  }
};
