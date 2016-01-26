import { Vue } from 'global';

Vue.filter('customCurrency', (value) => {
  return value < 0 ? `(${Vue.filter('currency')(-value)})` : Vue.filter('currency')(value);
});
