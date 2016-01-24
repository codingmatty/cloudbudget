import 'jquery';
import 'jquery-ui';
import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VueResource from 'vue-resource';

Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VueResource);

Vue.http.options.root = '/api/v1';

export {
  Vue,
  Vuex,
  VueRouter,
  VueResource
};
