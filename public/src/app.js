import vueboot from 'vueboot';
import './modules';
import router from './utils/router';
import { navbar } from './components';

const App = {
  template: require('./App.html'),
  components: {
    navbar,
    modal: vueboot.modal
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
