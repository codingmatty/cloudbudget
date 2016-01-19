import { VueRouter } from './global';
import store from './store';
import { login, user, dashboard } from './components';

const router = new VueRouter({
  hashbang: false,
  history: true
});

router.map({
  '/login': {
    name: 'login',
    component: login,
  },
  '/user': {
    name: 'user',
    component: user,
    auth: true
  },
  '/accounts': {
    name: 'dashboard',
    component: dashboard,
    auth: true
  }
});

router.beforeEach(({ to, next, redirect }) => {
  if (to.auth && !store.state.userState.user) {
    redirect('/login');
  } else if (to.path === '/login' && store.state.userState.user) {
    redirect('/accounts');
  } else {
    next();
  }
});

export default router;
