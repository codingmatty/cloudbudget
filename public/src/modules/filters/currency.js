import { Vue } from 'global';

Vue.filter('cbCurrency', (value) => {
  return value < 0 ? `(${Vue.filter('currency')(-value)})` : Vue.filter('currency')(value);
});
