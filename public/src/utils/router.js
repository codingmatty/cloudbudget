import { VueRouter } from '../global';
import store from '../store';
import { login, user, accounts, four0four } from '../components';

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
  '/accounts/:account_id': {
    name: 'accounts',
    component: accounts,
    auth: true
  },
  '/*any': {
    name: '404',
    component: four0four
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
