import router from './router';
import { navbar } from './components';

const App = {
  template: require('./App.html'),
  components: {
    navbar
  }
};

router.start(App, 'app');

export default App;
