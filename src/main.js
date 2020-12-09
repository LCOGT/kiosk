import Vue from 'vue'
import App from './App'
import axios from 'axios'
import store from "./store";
import './../node_modules/bulma/css/bulma.css';

require("typeface-roboto")
require("typeface-lato")

Vue.prototype.$http = axios
Vue.config.productionTip = false

new Vue({
  el: "#app",
  store,
  template: "<App/>",
  components: { App }
});
