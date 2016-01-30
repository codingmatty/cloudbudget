import four0fourTemplate from './404.html';

export default {
  template: four0fourTemplate,
  computed: {
    path() {
      return this.$route.params.any;
    }
  }
};
