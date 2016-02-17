import 'config';
import './modules';
import router from 'config/router';
import { navbar } from 'components';
import appTemplate from './App.html';

const App = {
  template: appTemplate,
  components: {
    navbar
  }
};

router.start(App, 'app');

export default App;
