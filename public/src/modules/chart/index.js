import _ from 'lodash';
import c3 from 'c3';
import d3 from 'd3';
import { Vue } from 'global';

Vue.component('chart', {
  template: '<div></div>',
  props: ['type', 'data', 'axis', 'tooltip'],
  ready() {
    this.chart = c3.generate({
      bindto: d3.select(this.$el),
      data: this.data,
      axis: this.axis
    });
  },
  watch: {
    ['data'](value, oldValue) {
      const oldColumns = _.merge(oldValue).columns;
      const newColumns = _.merge(value).columns;
      if (!_.isEqual(oldColumns, newColumns)) {
        const loadData = {
          columns: newColumns
        };
        if (this.currentRoute !== this.$route.params.account_id) {
          this.currentRoute = this.$route.params.account_id;
          loadData.unload = true;
        }
        this.chart.load(loadData);
      }

    }
  }
});
