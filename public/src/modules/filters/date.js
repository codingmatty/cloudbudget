import moment from 'moment';
import { Vue } from 'global';

Vue.filter('date', {
  read(value, format) {
    return moment(new Date(value).toISOString()).format(format);
  },
  write(value, format) {
    return moment(new Date(value).toISOString()).format(format);
  }
});
