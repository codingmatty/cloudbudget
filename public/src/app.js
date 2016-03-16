import 'config';
import 'components';
import router from 'config/router';
import appTemplate from './App.html';

const App = {
  template: appTemplate
};

router.start(App, 'app');

export default App;
