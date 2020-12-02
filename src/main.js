import Vue from 'vue'
import App from './App'
import axios from 'axios'
import store from "./store";
import './../node_modules/bulma/css/bulma.css';

const token = localStorage.getItem('lco_token')
if (token) {
  axios.defaults.headers.common['Authorization'] = 'Token '+ token;
}

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
