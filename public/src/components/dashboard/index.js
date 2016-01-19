import accounts from './accounts';
import transactions from './transactions';

export default {
  template: require('./dashboard.html'),
  components: {
    accounts,
    transactions
  }
};
