<template>

  <div id="observation-form" v-if="loggedin">
    <div class="select">
      <select v-model="observation.proposal">
      <option disabled value="">Select your project</option>
      <option v-for="proposal in proposals" v-bind:value="proposal.value" v-bind:key="proposal.id">
        {{proposal.text}}
      </option>
      </select>
    </div>

      <div id="select-form" v-if="mode === 'select'" class="level">
        <p>Which type of object?</p>
        <div class="level-item" v-for="item in object_types">
          <button v-on:click="selectObject(item.avm)" class="button">{{ item.name }}</button>
        </div>
      </div>

      <div class="columns is-multiline">
      <div class="column is-one-quarter" v-for="item in objects">
        <div class="box">
            <article class="media">
              <div class="media-content">
                <div class="content">
                  <p>
                    <a v-on:click="scheduleSelectObject(item)">{{item.name}}</a>
                    <br>
                      {{item.desc}}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

    <form @submit.prevent="handleSubmit" v-if="mode === 'manual'">

      <label class="label">Target name</label>
      <input
        ref="first"
        type="text"
        :class="{ 'has-error': submitting && invalidName }"
        class="input"
        v-model="observation.name"
        v-on:focus="clearStatus"
        v-on:change="lookUp"
      >
      <p
        v-if="error"
        class="error-message"
      >❗{{error}}</p>
      <p
        v-if="lookedup"
        class="success-message"
      >✅ {{lookupmsg}}</p>
      <label class="label">Project Name</label>
      <p
        v-if="submitting"
        class="pending-message"
      >🔶 Pending</p>
      <p
        v-if="errorMsg && !submitting"
        class="error-message"
      >❗{{errorMsg}}</p>
      <p
        v-if="success"
        class="success-message"
      >✅ Observation successfully submitted</p>
      <button class="button">Submit</button>
    </form>

  </div>
</template>

<script>
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
      submitting: false,
      observation: {
        name: '',
        coords: '',
        proposal: '',
        type:''
      },
      object_types: [
        {"name":"Galaxy","avm":"5"},
        {"name": "Planet", "avm":"1.1" },
        {"name":"Star Cluster", "avm":"3.6.4"},
        {"name":"Nebula", "avm":"4"},
        {"name":"Moon", "avm":"99"}
        ],
      objects: [],
      startstamp: '',
      endstamp: '',
      error:'',
      success: false,
      lookedup:false,
      lookupmsg: ''
    }
  },
  mounted() {
    this.setWindows()
  },
  computed: {
    invalidName() {
      return this.observation.name === ''
    },
    errorMsg() {
      return this.message
    }
  },
  methods: {
    async lookUp() {
      this.clearStatus()
      var target_type = 'sidereal'
      var whatsup = false
      var planets = ['mercury','mars','venus','uranus','jupiter','neptune','saturn']
      try {
        if (planets.includes(this.observation.name.toLowerCase())){
          target_type = 'non_sidereal'
        }
        const response = await fetch(`https://whatsup.lco.global/target/?name=${this.observation.name}&aperture=0m4`)
        var data = await response.json()

        if (data.target.length == 0){
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
            this.observation.coords = {ra:ra,dec:dec,filters:filters}
            this.observation.type = target_type
            this.lookedup = true
          }
        }
      } catch (error) {
        this.error = error.response
      }
    },

    async handleSubmit() {
      this.clearStatus()
      this.submitting = true

      if (this.invalidName) {
        this.error = 'You must type a valid object name'
        return
      }
      var data = this.buildRequest()
      await this.$emit('add:observation', data)
      this.$refs.first.focus()
      this.submitting = false
    },

    clearStatus() {
      this.success = false
      this.lookedup = false
      this.submitting = false
      this.error = ''
      this.errorSubmit = ''
    },
    buildTarget(){
      var target;
      if (this.observation.type == 'sidereal'){
        target = {
          "type": "ICRS",
          "name": this.observation['name'],
          "ra": this.observation.coords['ra'],
          "dec": this.observation.coords['dec'],
          'epoch': 2000
        }
      } else {
        var epoch = this.observation.coords['epoch_jd'] - 2400000.5;
        target = {
          "type": "ORBITAL_ELEMENTS",
          "name": this.observation['name'],
          "epochofel": epoch,
          "scheme": "JPL_MAJOR_PLANET",
          "orbinc": this.observation.coords['inclination'],
          "longascnode": this.observation.coords['ascending_node'],
          "argofperih": this.observation.coords['argument_of_perihelion'],
          "meandist": this.observation.coords['semimajor_axis'],
          "eccentricity": this.observation.coords['eccentricity'],
          "meananom": this.observation.coords['mean_anomaly'],
          "dailymot":this.observation.coords['mean_daily_motion']
        }
      }
      return target
    },
    buildConfigs(){
      var configs = Array()
      if (this.observation.coords.filters){
        for (var i=0;i<this.observation.coords.filters.length;i++){
          configs.push({'filter': this.observation.coords.filters[i].name,
                        'exposure': this.observation.coords.filters[i].exposure})
        }
        return configs
      }
      var planets = {
        'jupiter' : {'filter':'up', 'exposure':0.2},
        'mars' : {'filter':'rp', 'exposure':5},
        'uranus' :{'filter':'rp', 'exposure':5},
        'neptune' : {'filter':'rp', 'exposure':5},
        'mercury' : {'filter':'rp', 'exposure':5},
        'saturn' :{'filter':'up', 'exposure':0.5},
        'venus' : {'filter':'up', 'exposure':0.1}
      }
      if (this.observation.name.toLowerCase().substring(0,3) == 'ngc'){
        configs = [
          {'filter':'rp', 'exposure':120},
          {'filter':'B', 'exposure':120},
          {'filter':'V', 'exposure':120}
        ]
      } else if (this.observation.type == 'non_sidereal'){
        try {
          configs = [planets[this.observation.name.toLowerCase()]]
          console.log(configs)
        } catch(error) {
          console.error(error)
          configs = [{'filter':'u', 'exposure':0.1}]
        }
      } else if (this.observation.name.toLowerCase().substring(0,1) == 'm'){
        configs = [
          {'filter':'rp', 'exposure':90},
          {'filter':'B', 'exposure':90},
          {'filter':'V', 'exposure':90}
        ]
      }

      return configs
    },
    buildRequest(){
      var target = this.buildTarget()
      var configs = this.buildConfigs()
      var constraints = constraints = {
        'max_airmass': 1.6,
        'min_lunar_distance': 30
      }
      var inst_configs = Array();
      for (var i=0;i<configs.length;i++){
          var conf = {
                    'exposure_time': configs[i]['exposure'],
                    'exposure_count': 1,
                    'optical_elements': {
                        'filter': configs[i]['filter']
                    }
                }
          inst_configs.push(conf)
      }
      var config  = [{
            'type': 'EXPOSE',
            'instrument_type': '0M4-SCICAM-SBIG',
            'target': target,
            'constraints': constraints,
            'acquisition_config': {},
            'guiding_config': {},
            'instrument_configs': inst_configs
        }]
      var timewindow = {
        "start": this.startstamp,
        "end": this.endstamp
        }
      var request = {
        "location":{"telescope_class":"0m4"},
        "constraints":{"max_airmass":2.0},
        "target": target,
        "configurations": config,
        "windows": [timewindow],
        "observation_note" : "Serol",
        "type":"request"
      }
      var data = {
          "name": "kiosk-"+this.observation.name,
          "proposal": this.observation.proposal,
          "ipp_value": 1.05,
          "operator": "SINGLE",
          "observation_type": "NORMAL",
          "requests": [request],
      }
      return data
    },
    setWindows() {
  		var start = new Date();
  		var end = new Date();
  		this.startstamp = start.toISOString().substring(0,19);
  		end.setDate( end.getDate() + 7 );
  		this.endstamp = end.toISOString().substring(0,19);
  	},
    async selectObject (avm) {
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
      this.objects = data.targets
    },
    scheduleSelectObject(data) {
      this.submitting = true
      this.$emit('changemode', 'submit')
      this.observation.type = 'sidereal'
      this.observation.name = data.name
      this.observation.coords = {
          'ra'  : data.ra,
          'dec' : data.dec
        }
      this.handleSubmit()
    }
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
</style>
