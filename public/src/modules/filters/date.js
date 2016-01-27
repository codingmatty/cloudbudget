import moment from 'moment';
import { Vue } from 'global';

// Add a day to accomodate that the value of 2016-01-01 actually refers to the 2nd day of the month..
Vue.filter('date', {
  read(value, format) {
    return moment(new Date(value).toISOString()).add(1, 'days').format(format);
  },
  write(value, oldValue, format) {
    return moment(new Date(value).toISOString()).add(1, 'days').format(format);
  }
});
