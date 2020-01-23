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
        <img src="@/assets/LCO_logo.jpg" alt="LCO logo"/>
      </p>
    </div>
  </nav>
    <login-form
    :loggedin="loggedin"
    @login:user="login"
    @logout:user="logout"
     />
   <div class="columns">
     <div class="column is-half">
     <select-form
     :mode="mode"
     :loggedin="loggedin"
     :message="message"
     @changemode="changeMode"
     />
    <observation-form
    :mode="mode"
    :proposals="proposals"
    :loggedin="loggedin"
    :message="message"
    :token="token"
    @changemode="changeMode"
    @changemessage="changeMessage"
    @getobservations="getObservations"
    />
  </div>
  <div class="column is-half">
    <observation-table
      :observations="observations"
      :proposals="proposals"
      :loggedin="loggedin"
      :next_obs="next_obs"
      :prev_obs="prev_obs"
      @delete:observation="deleteObservation"
      @getobservations="getObservations"
    />
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

export default {
  name: "app",
  components: {
    ObservationTable,
    ObservationForm,
    LoginForm,
    SelectForm,
  },
  data() {
    return {
      observations: [],
      proposals: [],
      default_proposal:'',
      loggedin:false,
      token:undefined,
      user:undefined,
      obs:undefined,
      archive:undefined,
      message: '',
      success: false,
      mode:'',
      next_obs: '',
      prev_obs:''
    }
  },

  mounted() {
    if (localStorage.getItem("lco_token")){
      this.token = localStorage.getItem("lco_token");
      this.loggedin = true;
      this.getProposals();
      this.getObservations();
    }
  },

  methods: {
    async getObservations(next=false, prev=false) {
      try {
        const requestOptions = {
            method: 'GET',
            headers: this.authHeader()
        };
        var url
        if (this.next_obs && next){
          url = this.next_obs
        }else if (this.prev_obs && prev){
          url = this.prev_obs
        } else {
          url = `https://observe.lco.global/api/requestgroups/?user=${this.user}`
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
    async getProposals() {
      try {
        const requestOptions = {
            method: 'GET',
            headers: this.authHeader()
        };
        const response = await this.$http.get('https://observe.lco.global/api/profile/', requestOptions)
        const data = await response.data
        this.handleProfile(data)
      } catch (error) {
        console.error(error)
      }
    },
    async login(username, password) {
        const requestOptions = {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            data: { username, password },
            url: 'https://observe.lco.global/api/api-token-auth/',
        };

        const response = await this.$http(requestOptions)
        const data = await response.data
        // login successful if there's a user in the response
        if (data['token']) {
            this.mode = 'start'
            this.user = username;
            this.loggedin = true;
            this.token = data['token'];
            localStorage.setItem("lco_token", this.token );
            await this.getProposals()
            this.getObservations()
        }
    },
    logout() {
        // remove user from local storage to log user out
        this.user = undefined;
        this.loggedin = false;
        localStorage.removeItem("lco_token");
    },
    handleProfile(data){
        var proposals = new Array;
        for (var i=0; i<data.proposals.length;i++){
          if (data.proposals[i].current){
            proposals.push({'text':data.proposals[i].title,'value':data.proposals[i].id})
          }
        }
        this.archive = data.tokens.archive;
        this.proposals = proposals;
        if (proposals.length == 1){
          this.default_proposal = proposals[0]
        }
        this.user = data.username;
    },
    changeMode(mode){
      this.mode = mode
    },
    changeMessage(message){
      this.message = null
    },
    authHeader() {
      return { 'Authorization': 'Token '+this.token};
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
