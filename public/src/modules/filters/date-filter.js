import { Vue } from '../../global';
import moment from 'moment';

Vue.filter('date', {
  read(value, format) {
    return moment(new Date(value).toISOString()).format(format);
  },
  write(value, format) {
    return moment(new Date(value).toISOString()).format(format);
  }
});
