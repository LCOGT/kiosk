<template>
  <div
    id="app"
    class="container"
  >
  <nav class="level" id="header">
    <div class="level-left">
        <p class="level-item has-text-centered">
          <img src="@/assets/kiosk-logo.png" alt="Kiosk logo"/>
        </p>
    </div>
    <div class="level-right">
      <p class="level-item has-text-centered">
        <a href="https://lco.global" title="LCO website"><img src="@/assets/LCO_logo.jpg" alt="LCO logo"/></a>
      </p>
    </div>
  </nav>
    <login-form
    :loggedin="loggedin"
    @login:user="login-form"
    @logout:user="logout"
     />
   <div class="columns">
     <div class="column is-half">
       <select-form />
       <observation-form />
     </div>
     <div class="column is-half">
      <observation-table />
     </div>
  </div>
</div>
</template>

<script>
import ObservationTable from '@/components/ObservationTable.vue'
import ObservationForm from '@/components/ObservationForm.vue'
import LoginForm from '@/components/LoginForm.vue'
import SelectForm from '@/components/SelectForm.vue'
import "../node_modules/bulma/bulma.sass";
import { USER_REQUEST } from "actions/user";
import { mapGetters, mapState } from "vuex";
import axios from 'axios'
import Vue from "vue";


export default {
  name: "app",
  components: {
    ObservationTable,
    ObservationForm,
    LoginForm,
    SelectForm,
  },
  created: function() {
    if (this.$store.getters.isAuthenticated) {
      this.$store.dispatch(USER_REQUEST);
    }
  },
  data() {
    return {
      observations: [],
      proposals: [],
      default_proposal:'',
      loggedin:false,
      token:undefined,
      obs:undefined,
      archive:undefined,
      message: '',
      success: false,
      mode:'',
      next_obs: '',
      prev_obs:'',
      user:''
    }
  },

  mounted() {
    if (this.$store.getters.isAuthenticated){
      this.loggedin = true;
    }
  },
  methods: {
    async getObservations(next=false, prev=false, target_name=undefined) {
      try {
        const requestOptions = {
            method: 'GET',
            headers: this.authHeader()
        };
        var url = `https://observe.lco.global/api/requestgroups/?user={this.$store.state.user.profile.user}`

        if (this.next_obs && next){
          url = this.next_obs
        }else if (this.prev_obs && prev){
          url = this.prev_obs
        }else if (target_name) {
          url = `${url}&target=${target_name}`
        }
        const response = await fetch(url, requestOptions)
        const data = await response.json()
        this.observations = data.results
        this.next_obs = data.next
        this.prev_obs = data.previous
      } catch (error) {
        console.log(error)
      }
    },
    async deleteObservation(id) {
      const requestOptions = {
        method: 'POST',
        headers: this.authHeader(),
        dataType: 'json',
        contentType: 'application/json'}
      try {
        var response = await this.$http(`https://observe.lco.global/api/requestgroups/${id}/cancel/`, requestOptions)
        if (response){
          this.getObservations()
        }
      } catch (error) {
        console.error(error.response)
      }
    },
    logout() {
        // remove user from local storage to log user out
        this.user = undefined;
        this.loggedin = false;
        localStorage.removeItem("lco_token");
    }
  },
}
</script>

<style>
h1 {
    font-family: 'Roboto', sans-serif;
}
body {
      font-family: 'Lato', sans-serif;
}

#header img{
  max-height:50px;
}

.small-container {
  max-width: 680px;
}
</style>
