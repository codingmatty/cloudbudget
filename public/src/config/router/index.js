import { VueRouter } from '../Vue';
import store from 'config/store';
import * as components from 'components';

const {
  userState
} = store.state;

const router = new VueRouter({
  hashbang: false,
  history: true,
  linkActiveClass: 'active'
});

router.map({
  '/login': {
    name: 'login',
    component: components.login,
  },
  '/user': {
    name: 'user',
    component: components.user,
    auth: true
  },
  '/accounts': {
    name: 'accounts',
    component: components.accounts,
    auth: true
  },
  '/accounts/:account_id': {
    name: 'accounts',
    component: components.accounts,
    auth: true
  },
  '/transactions': {
    name: 'transactions',
    component: components.transactions,
    auth: true
  },
  '/*any': {
    name: '404',
    component: components.four0four
  }
});

router.beforeEach(({ to, next, redirect }) => {
  const verifyAuthentication = () => {
    if (to.auth && !userState.user) {
      redirect('/login');
    } else if ((!to.fullPath || to.fullPath === '/' || to.fullPath === '/login') && userState.user) {
      redirect('/accounts'); // this should be some home route
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
