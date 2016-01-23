export default {
  template: require('./404.html'),
  computed: {
    path() {
      return this.$route.params.any;
    }
  }
};
