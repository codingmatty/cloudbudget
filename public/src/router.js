import { VueRouter } from './global';
import store from './store';
import { login, user, accounts, fourohfour } from './components';

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
    name: 'accounts',
    component: accounts,
    auth: true
  },
  '/*any': {
    name: '404',
    component: fourohfour
  }
});

router.beforeEach(({ to, next, redirect }) => {
  if (to.auth && !store.state.userState.user) {
    redirect('/login');
  } else if (to.path === '/login' && store.state.userState.user) {
    redirect('/accounts');
  } else if (to.path === '/') {
    redirect('/accounts');
  } else {
    next();
  }
});

export default router;
