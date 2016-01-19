import store from '../../store';

export default {
  template: require('./user.html'),
  computed: {
    user() {
      return store.state.userState.user;
    }
  }
};
