<template>

  <div id="observation-form" v-if="loggedin">
    <div class="field">
    <label class="label">Project Name: {{proposalName}}</label>
    <div class="control" v-show="!proposalName">
      <div class="select">
      <select v-model="observation.proposal">
      <option disabled value="">Select your project</option>
      <option v-for="proposal in proposals" v-bind:value="proposal.value" v-bind:key="proposal.id">
        {{proposal.text}}
      </option>
      </select>
    </div>
    </div>
  </div>

      <div id="select-form" v-show="mode === 'select'">
        <p class="is-size-4">Select a type of target?</p>
        <div class="level">
          <div class="level-item" v-for="item in object_types">
            <button v-on:click="whatsupObjects(item.avm)" class="button">{{ item.name }}</button>
          </div>
        </div>
          <div v-if="object_type === 'planet'">
            <p>Select a planet</p>
            <div class="buttons">
            <div v-for="item in planets">
              <button v-on:click="lookUpPlanet(item)" class="button is-capitalized">{{ item }}</button>
            </div>
          </div>
        </div>
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

    <div v-show="mode === 'manual'">

      <label class="label">Target name</label>
      <div class="field has-addons">
        <div class="control">
          <input
            ref="first"
            type="text"
            :class="{ 'has-error': submitting }"
            class="input"
            v-model="observation.name"
            v-on:focus="clearStatus"
            v-on:change="lookUp"
          >
        </div>
        <div class="control">
          <a class="button is-info" v-on:click="lookUp">
            Search
          </a>
        </div>
      </div>
    </div>
    <p
      v-if="error"
      class="error-message"
    ><i class="fad fa-exclamation-triangle"></i>{{error}}</p>
    <p
      v-if="lookedup"
      class="success-message"
    ><i class="fa fa-smile"></i> {{lookupmsg}}<br/>
    </p>
    <p
      v-if="submitting"
      class="pending-message"
    ><i class="far fa-clock"></i> Pending</p>
    <p
      v-if="errorMsg && submitted"
      class="error-message"
    ><i class="fad fa-exclamation-triangle"></i>{{errorMsg}}</p>
    <p
      v-if="success"
      class="success-message"
    ><i class="fa fa-check"></i> Observation successfully submitted</p>

    <div id="object-info" v-if="observation.name">
      <h3>{{observation.name}}</h3>
      <p v-if="observation.desc">
        {{observation.desc}}
      </p>
    </div>

    <div class="field is-grouped">
        <p class="control">
        <button class="button  is-primary" v-on:click="handleSubmit">Submit</button>
      </p>
        <p class="control">
        <button class="button  is-secondary" v-on:click="$emit('changemode', 'start')">Reset</button>
      </p>
    </div>
  </div>
</template>

<script>
import { buildRequest } from '../utils/schedule.js'

export default {
  name: 'observation-form',
  props: {
    proposals: Array,
    loggedin: Boolean,
    obs: Object,
    message: String,
    mode: String
  },
  data() {
    return {
      submitted: false,
      submitting: false,
      observation: {
        name: '',
        coords: '',
        proposal: '',
        type:'',
        desc:''
      },
      object_types: [
        {"name":"Galaxy","avm":"5"},
        {"name": "Planet", "avm":"1.1" },
        {"name":"Star Cluster", "avm":"3.6.4"},
        {"name":"Nebula", "avm":"4"},
        {"name":"Moon", "avm":"99"}
        ],
      object_type: '',
      objects: [],
      error:'',
      success: false,
      lookedup:false,
      lookupmsg: '',
      planets: ['mercury','mars','venus','uranus','jupiter','neptune','saturn']
    }
  },
  computed: {
    errorMsg() {
      return this.message
    },
    proposalName(){
      for (var i=0;i<this.proposals.length;i++){
          if (this.proposals[i].value == this.observation.proposal){
            return this.proposals[i].text
          }
      };
    }
  },
  methods: {
    async lookUp() {
      this.clearStatus()
      var target_type = 'sidereal'
      var whatsup = false
      var data
      try {
        if (this.planets.includes(this.observation.name.toLowerCase())){
          target_type = 'non_sidereal'
        } else {
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
          if (data.error){
            this.error = data.error
          } else {
            if (whatsup){
              var ra = data.target.ra
              var dec = data.target.dec
              var filters = data.target.filters
              this.lookupmsg = data.target.desc
            } else {
              var ra = data.ra_d
              var dec = data.dec_d
              var filters = []
              this.lookupmsg = `${this.observation.name} coordinates found`
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
        this.error = error.response
      }
    },
    lookUpPlanet(name){
      this.error = ''
      this.observation.name = name
      this.lookUp()
    },
    async handleSubmit() {
      this.clearStatus()
      this.submitting = true
      this.submitted = true

      if (!this.observation.name) {
        this.submitting = false
        this.error = 'You must type a valid object name'
        return
      }
      if (!this.observation.proposal) {
        this.submitting = false
        this.error = 'Please select your project'
        return
      }
      var data = buildRequest(this.observation)
      await this.$emit('add:observation', data)
      // this.$refs.first.focus()
      this.submitting = false
      this.$emit('changemode', 'start')
    },

    clearStatus() {
      this.success = false
      this.lookedup = false
      this.submitting = false
      this.error = ''
      this.errorSubmit = ''
      this.objects = []
      this.object_type = null
      this.$emit('changemessage', '')
      this.submitted = false
    },
    async whatsupObjects (avm) {
      this.clearStatus()
      if (avm=='1.1'){
        this.object_type = 'planet'
        this.objects = null
        return
      }
      var start = new Date();
      var end = new Date();
      var startstamp = start.toISOString().substring(0,19);
      end.setDate( end.getDate() + 7 );
      var endstamp = end.toISOString().substring(0,19);
      const requestOptions = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      var url = `https://whatsup.lco.global/range/?start=${startstamp}&aperture=0m4&end=${endstamp}&category=${avm}&format=json`;
      const response = await fetch(url, requestOptions)
      var data = await response.json()
      this.objects = data.targets.slice(0,8)
    },
    selectObject(data){
      this.error = ''
      this.objects = []
      this.observation.type = 'sidereal'
      this.observation.name = data.name
      this.observation.desc = data.desc
      this.observation.coords = {
          'ra'  : data.ra,
          'dec' : data.dec
        }
    },

  }}
</script>

<style scoped>
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

.box .content:hover {
  overflow: visible;
}

</style>
