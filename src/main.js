import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import './../node_modules/bulma/css/bulma.css';

require("typeface-roboto")
require("typeface-lato")

Vue.prototype.$http = axios
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
