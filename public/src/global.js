import Vue from 'vue';
import VueRouter from 'vue-router';
import VueResource from 'vue-resource';

Vue.use(VueRouter);
Vue.use(VueResource);

Vue.http.options.root = '/api/v1';
// Set this after login...
Vue.http.headers.common.Authorization = 'Bearer mvXJD61sNyaBmABXwJh4QKDBCqxOKrUSQxQaMqxs7HWDTLK0EvyF7xCo0LtWwrso';

export default Vue;
export {
  Vue,
  VueRouter,
  VueResource
};
