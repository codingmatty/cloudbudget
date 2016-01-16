import { Vue, VueRouter } from './global';
import { login, dashboard } from './components';

Vue.use(VueRouter);

const App = {
  template: require('./App.html'),
  components: {
    login,
    dashboard
  }
};

const router = new VueRouter({
  hashbang: false,
  history: true
});

router.map({
  '/login': {
    name: 'login',
    component: login
  },
  '/': {
    name: 'dashboard',
    component: dashboard
  }
});

router.start(App, 'app');

export default App;
