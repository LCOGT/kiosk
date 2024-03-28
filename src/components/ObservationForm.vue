<template>

  <div id="observation-form" v-if="isAuthenticated">


      <div id="select-form" v-show="getMode == 'select'" class="pb-4">
        <p class="is-size-4">Select a type of target</p>
        <div class="field">
          <div class="buttons has-addons">
            <button v-for="item in object_types" v-on:click="whatsupObjects(item.avm)" class="button">
              {{ item.name }}
            </button>
          </div>
        </div>
        <div class="field">
          <div v-if="object_type == 'planet'">
            <p>Select a planet</p>
            <div class="buttons has-addons">
              <button v-for="item in planets" v-on:click="lookUp(name=item)" class="button is-capitalized">
                {{ item }}
              </button>
          </div>
        </div>
      </div>
        <div v-if="isMoon">
          <p class="pb-2"><i class="fad fa-moon"></i> We will schedule 3 images of the Moon in the next 2 weeks.</p>
      </div>


      <div class="columns is-multiline">
      <div class="column is-one-third" v-for="item in objects">
        <div class="box">
            <article class="media">
              <div class="media-content">
                <div class="content">
                  <p class="block-with-text">
                    <a v-on:click="selectObject(item)" class="is-size-5">{{item.name}}</a>
                    <br>
                      {{item.desc}}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>


    </div>

    <div v-show="getMode == 'manual'" class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Target</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <div class="control">
            <input
              ref="first"
              type="text"
              :class="{ 'has-error': submitting }"
              class="input"
              v-model="object_name"
              v-on:focus="clearStatus"
              placeholder="Enter target name"
            >
          </div>
          <div class="control">
            <a class="button is-info" v-on:click="lookUp">
              Search
            </a>
          </div>
        </div>
      </div>
    </div>

  <div class="container">
    <div id="object-info" v-if="observation.name && !getError">
      <h3 class="is-size-4 success-message"><i class="fa fa-check"></i> {{observation.name}} selected</h3>
    </div>
    <p
      v-if="getInfo"
      class="success-message"
    ><i :class="targetIcon"></i> {{getInfo}}<br/>
    </p>
    <p
      v-if="submitting && !getError"
      class="pending-message"
    ><i class="fas fa-spinner fa-spin"></i> Sending to scheduler</p>
    <p
      v-if="getError && (submitted || preflight)"
      class="error-message"
    ><i class="fad fa-exclamation-triangle"></i>{{getError}}</p>
    <p
      v-if="success"
      class="success-message"
    ><i class="fa fa-check"></i> Observation successfully submitted</p>

    <div class="field is-grouped">
      <div class="control">
        <button class="button  is-primary" v-on:click="handleSubmit" :disabled='submitDisabled'>Submit</button>
      </div>
      <div class="control">
        <button class="button  is-secondary" v-on:click="reset">Reset</button>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { buildRequest } from '../utils/schedule.js'
import { mapState, mapGetters } from "vuex";
import axios from "axios";


export default {
  name: 'observation-form',
  data() {
    return {
      submitted: false,
      submitting: false,
      preflight: false,
      observation: {
        name: '',
        coords: '',
        proposal: '',
        type:'',
      },
      object_name:'',
      object_types: [
        {"name": "Moon", "avm":"1.4" },
        {"name": "Planet", "avm":"1.1" },
        {"name":"Galaxy","avm":"5"},
        {"name":"Star Cluster", "avm":"3.6.4"},
        {"name":"Nebula", "avm":"4"},
        ],
      object_type: '',
      objects: [],
      success: false,
      lookedup:false,
      planets: ['mars','jupiter','saturn','uranus']
    }
  },
  computed: {
    targetIcon() {
      var icons = {'planet':'fas fa-planet-ringed',
      '5':'fas fa-galaxy',
      '4':'fad fa-smoke',
      '3.6.4':'fas fa-stars'}
      return icons[this.object_type]
    },
    isMoon(){
      if (this.object_type == 'moon'){
        this.preflight = true;
        return true
      } else {
        this.preflight = false;
      }
    },
    submitDisabled(){
      if (!this.$store.getters.defaultProposal){
        return true
      } else if (this.$store.getters.getProfile.aperture.id != '0M4-SCICAM-QHY600' && this.object_type == 'moon') {
        this.$store.commit('updateError',"Moon observations are only available on 0.4m telescopes currently")
        return true
      } else {
        return false
      }
    },
    ...mapGetters(["isAuthenticated", "currentProposalName","defaultProposal",
                   "getProfile", "getMode", "getInfo", "getError", "authHeader"])
  },

  methods: {
    reset(){
      this.clearStatus()
      this.$store.commit('modeStart')
    },
    async lookUp(name='') {

      // this.clearStatus()
      if (this.object_name){
        this.observation.name = this.object_name
        this.object_name = ''
      } else if (name){
        this.observation.name = name
      }
      var target_type = 'sidereal'
      var whatsup = false
      var data
      try {
        if (this.planets.includes(this.observation.name.toLowerCase())){
          target_type = 'non_sidereal'
        }  else {
          const response = await fetch(`https://whatsup.lco.global/target/?name=${this.observation.name}&aperture=0m4`)
          data = await response.json()
        }

        if (data == undefined || data.target.length == 0){
          const response = await fetch('https://simbad2k.lco.global/'+this.observation.name+'?target_type='+target_type)
          data = await response.json()
        } else {
          whatsup = true
        }
        if (data) {
          if (data.error != undefined){
            this.$store.commit('updateError',data.error)
          } else {
            if (whatsup){
              var ra = data.target.ra
              var dec = data.target.dec
              var filters = data.target.filters
              this.$store.commit('updateInfo',data.target.desc)
            } else {
              var ra = data.ra_d
              var dec = data.dec_d
              var filters = []
              this.$store.commit('updateInfo',"Coordinates found")
            }
            if (target_type == 'non_sidereal'){
              this.observation.coords = data
            } else {
              this.observation.coords = {ra:ra,dec:dec,filters:filters}
            }
            this.observation.type = target_type
            this.lookedup = true
          }
        }
      } catch (error) {
        this.$store.commit('updateError',"Target could not be found")
      }
    },
    async handleSubmit() {
      this.submitting = true
      this.submitted = true
      this.observation.proposal = this.$store.getters.defaultProposal
      this.observation.instrument = this.$store.getters.getProfile.aperture

      if (!this.observation.name && !this.object_type == 'moon') {
        this.submitting = false
        this.$store.commit('updateError','You must type a valid object name')
        return
      }
      if (!this.observation.proposal) {
        this.submitting = false
        this.$store.commit('updateError','Please select your project')
        return
      }
      if (this.object_type == 'moon'){
        this.observation.name = 'Moon'
        this.observation.object_type = this.object_type
      }
      var data = buildRequest(this.observation)
      await this.addObservation(data)
    },
    addObservation(data) {
      this.$store.commit('updateError','')
        var requestOptions = {
          method: 'POST',
          data: data.observation,
          url: data.url,
          headers: this.$store.getters.authHeader,
        }
        axios(requestOptions)
          .then( response => {
            if (response.status == 200 || response.status == 201){
              this.clearStatus()
              this.$store.commit('modeStart')
              this.success = true
              this.$store.dispatch('USER_OBSERVATIONS')
              return response.data
            } else {
              this.$store.commit('updateError',response)
              return false
            }
          })
      .catch((error) => {
        if (error.response) {
          var req  = error.response.data.requests
          if (req){
            var txt = 'There was a problem submitting this request'
            for(var i=0; i < req.length; i++){
              if (req[i].non_field_errors){
                txt = req[i]['non_field_errors'][0]
              }
            }
            this.$store.commit('updateError',txt)
          }
        } else {
          console.log('Error', error.message);
          this.$store.commit('updateError','There was a problem submitting this request')
        }
      })
    },
    clearStatus() {
      this.success = false
      this.lookedup = false
      this.$store.commit('updateInfo','')
      this.submitting = false
      this.$store.commit('updateError','')
      this.errorSubmit = ''
      this.objects = []
      this.object_type = null
      this.submitted = false
      this.observation.name = ''
      this.observation.desc = ''
    },
    async whatsupObjects (avm) {
      const telescopes = {'0M4-SCICAM-QHY600' : '0m4',
          '2M0-SCICAM-MUSCAT' : '2m0',
          '1M0-SCICAM-SINISTRO' : '1m0',
          '2M0-SCICAM-SPECTRAL' : '2m0',
        };

      this.clearStatus()
      if (avm=='1.1'){
        this.object_type = 'planet'
        this.objects = null
        return
      }if (avm=='1.4'){
        this.object_type = 'moon'
        this.objects = null
        return
      } else {
        this.object_type = avm
      }
      var start = new Date();
      var end = new Date();
      var startstamp = start.toISOString().substring(0,19);
      var aperture = this.getProfile.aperture.id
      var telescope = telescopes[aperture];
      end.setDate( end.getDate() + 7 );
      var endstamp = end.toISOString().substring(0,19);
      const requestOptions = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      var url = `https://whatsup.lco.global/range/?start=${startstamp}&aperture=${telescope}&end=${endstamp}&category=${avm}&format=json`;
      const response = await fetch(url, requestOptions)
      var data = await response.json()
      this.objects = data.targets.slice(0,6)
    },
    selectObject(data){
      this.$store.commit('updateError','')
      this.objects = []
      this.observation.type = 'sidereal'
      this.observation.name = data.name
      this.$store.commit('updateInfo',data.desc)
      this.lookedup = true
      this.observation.coords = {
          'ra'  : data.ra,
          'dec' : data.dec,
          'filters': data.filters
        }
    },

  }}
</script>

<style scoped>
body {
      font-family: 'Lato', sans-serif;
}
ul {
  list-style-type: none;
}
form {
  margin-bottom: 2rem;
}

[class*="-message"] {
  font-weight: 500;
}

.error-message {
  color: #d33c40;
}

.success-message {
  color: #32a95d;
}
.pending-message {
  color: #FFCE33;
}
.box .content {
  max-height:100px;
  overflow:hidden;
}

</style>
