import $ from 'jquery';
import { Vue } from 'global';

Vue.directive('autocomplete', {
  params: ['source'],
  paramWatchers: {
    source(val) {
      $(this.el).autocomplete('option', 'source', val);
    }
  },
  bind() {
    $(this.el).autocomplete({
      source: this.params.source
    });
    $(this.el).parent().addClass('ui-widget');
  }
});
