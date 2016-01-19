import router from './router';
import { navbar } from './components';

const App = {
  template: require('./App.html'),
  components: {
    navbar
  },
  data() {
    return {
    };
  },
  methods: {
  }
};

router.start(App, 'app');

export default App;
