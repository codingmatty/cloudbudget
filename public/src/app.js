import './modules';
import router from './utils/router';
import { navbar } from './components';

import appTemplate from './App.html';

const App = {
  template: appTemplate,
  components: {
    navbar
  },
  data() {
    return {
      modalComponent: 'modal'
    };
  },
  methods: {
    setModalComponent(modalComponent) {
      this.modalComponent = modalComponent;
    }
  }
};

router.start(App, 'app');

export default App;
