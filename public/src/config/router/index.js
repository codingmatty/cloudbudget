import { VueRouter } from '../Vue';
import store from 'config/store';
import * as pages from 'pages';

const {
  userState
} = store.state;

const router = new VueRouter({
  hashbang: false,
  history: true,
  linkActiveClass: 'active'
});

router.map({
  '/': {
    name: 'dashboard',
    component: pages.dashboard,
    auth: true
  },
  '/login': {
    name: 'login',
    component: pages.login,
  },
  '/user': {
    name: 'user',
    component: pages.user,
    auth: true
  },
  '/accounts': {
    name: 'accounts',
    component: pages.accounts,
    auth: true
  },
  '/accounts/:account_id': {
    name: 'accounts',
    component: pages.accounts,
    auth: true
  },
  '/transactions': {
    name: 'transactions',
    component: pages.transactions,
    auth: true
  },
  '/*any': {
    name: '404',
    component: pages.four0four
  }
});

router.beforeEach(({ to, next, redirect }) => {
  const verifyAuthentication = () => {
    if ((!to.fullPath || to.auth) && !userState.user) {
      redirect('/login');
    } else if ((!to.fullPath || to.fullPath === '/login') && userState.user) {
      redirect('/');
    } else {
      next();
    }
  };
  if (userState.token && !userState.user) { // waiting to verify stored token..
    const waitToVerifyAuthInterval = setInterval(() => {
      if (!userState.token || userState.user) {
        clearInterval(waitToVerifyAuthInterval);
        verifyAuthentication();
      }
    }, 200);
  } else {
    verifyAuthentication();
  }
});

export default router;
