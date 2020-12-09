<template>
  <div id="observation-table" v-if="isAuthenticated">
    <h3 class="is-size-4">Past Observations</h3>
    <div v-if="gettingimg === false && image.url">
      <img :src="image.url" :alt="image.name"/>
      <div class="level">
        <div class="level-item">
          <button class="button" v-on:click="generateLarge(image)">
            <span class="icon is-small">
              <span v-if="loadLarge">
                <i class="fa fa-spin fa-spinner"></i>
              </span>
              <span v-else>
              <i class="far fa-download"></i>
            </span>
            </span>
          </button>
        </div>
        <div class="level-item">
          <div class="is-size-5">
            <a :href="'https://observe.lco.global/requestgroups/'+image.id" target="_blank">{{image.name}}
              <span class="is-size-7"><i class="far fa-external-link"></i></span>
            </a></div>
        </div>
        <div class="level-item">
          <div class="tags has-addons">
            <span class="tag">Images</span>
            <span class="tag is-primary">{{image.count}}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="gettingimg === true">
        <div class="fa-3x">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
    </div>
    <p
      v-if="observations == undefined"
      class="empty-table"
    >
      No observations
    </p>
    <table v-else class="table is-fullwidth">
      <thead>
        <tr>
          <th>Target</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          :key="observation.id"
          v-for="observation in observations.results"
        >
          <td><a :href="'https://observe.lco.global/requestgroups/'+observation.id" target="_blank">{{observation.requests[0].configurations[0].target.name}}</a></td>
          <td :title="observation.state"><i class='far' v-bind:class="statusIcon(observation.state)"></i>
          <td v-if='observation.state=="PENDING"'>
            <button v-on:click="cancelObservation(observation.id)" class="button is-warning">Cancel</button>
          <td v-else-if='observation.state=="COMPLETED"'>
            <button v-on:click="getframeid(observation)" class="button is-info">Get Image</button>
          <td v-else>
          </td>

        </tr>
      </tbody>
    </table>
    <div class="field is-grouped">
      <p class="control" v-if="observations.previous">
        <button v-on:click="getObservations({'prev':observations.previous})" class="button">
        <span class="icon is-small">
          <i class="far fa-backward"></i>
        </span>
        <span>Previous</span>
      </button>
      </p>
      <p class="control" v-if="observations.next">
        <button v-on:click="getObservations({'next':observations.next})" class="button">
          <span>Next</span>
          <span class="icon is-small">
            <i class="far fa-forward"></i>
          </span>
        </button>
      </p>
      <div class="control">
        <a class="button" v-on:click="getObservations()">
          <i class="far fa-redo"></i>
        </a>
      </div>
      <div class="field has-addons">
        <div class="control">
          <input
            type="text"
            class="input"
            v-model="target_name"
            v-on:focus=""
            placeholder="Search your targets"
          >
        </div>
        <div class="control">
          <a class="button is-info" v-on:click="getObservations({'target':target_name})">
            <i class="far fa-search"></i>
          </a>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import axios from 'axios';

export default {
  name: 'observation-table',
  props: {
    next_obs: String,
    prev_obs: String
  },
  data() {
    return {
      gettingimg: null,
      image: {url:'',name:'',count:0, id:'',iscolour:false},
      loadLarge: false,
      target_name: undefined
    }
  },
  computed: {
    ...mapState({ observations: state => state.user.observations,
                    archive_token: state => state.user.profile.archive}),
    ...mapGetters(["isAuthenticated", "authHeader","archiveHeader", "getProfile", "getMode", "getInfo", "getError"])
  },
  methods: {
    statusIcon(state){
      var icon = {'COMPLETED' : 'fa-check',
                  'FAILED': 'fa-times',
                  'WINDOW_EXPIRED': 'fa-times',
                  'PENDING': 'fa-clock',
                  'CANCELED': 'fa-ban'};
      return icon[state]
    },
    getObservations(payload) {
      this.$store.dispatch('USER_OBSERVATIONS', payload)
    },
    getframeid(observation){
      let that = this;
      var data
      var reqnum = observation.requests[0].id
      that.gettingimg = true
      var url = `https://archive-api.lco.global/frames/?ordering=-id&limit=1&REQNUM=${reqnum}`
      axios({url:url, method:"GET", headers:this.$store.getters.archiveHeader})
          .then( resp => {
          var data = resp.data
          that.image.count = data.count
          if (data.results != undefined && data.results.length >0){
             that.image.id = observation.id
             that.image.frameid = data.results[0].id
             that.getThumbnail(that.image.frameid)
             .then(resp => {
               that.gettingimg = false
               that.image.name = observation.requests[0].configurations[0].target.name
               that.image.url = resp['url']
             })
          } else {
            that.gettingimg = false
            that.image.url = 'https://via.placeholder.com/600x200?text=No+Image+Data+Found'
            return
          }
      })
      .catch((error) => {
        console.error(error)
        that.gettingimg = false
        that.image.url = 'https://via.placeholder.com/600x200?text=Error'
        return
      })
    },
    async getThumbnail(frameid) {
      let that = this;
      var data
      try {
          const response = await fetch(`https://thumbnails.lco.global/${frameid}/?height=600&width=600&color=true`)
          data = await response.json()
          if (data.message == 'RVB frames not found'){
            const response = await fetch(`https://thumbnails.lco.global/${frameid}/?height=600&width=600`)
            data = await response.json()
            that.image.iscolour = false
          } else {
            that.image.iscolour = true
          }
          return data
      } catch(error){
        console.error(error)
      }
    },
    async generateLarge(image){
        let that = this;
        this.loadLarge = true;
        var url;
        if (image) {
          url = `https://thumbnails.lco.global/${image.frameid}/?width=4000&height=4000&color=${image.iscolour}`;
        } else {
          url = '';
        }
        var resp = await fetch(url)
        var data = await resp.json()
        that.loadLarge = false;
        window.open(data['url'], '_blank');
      },
      cancelObservation(id) {
        var url = `https://observe.lco.global/api/requestgroups/${id}/cancel/`
        axios({url:url, method:"POST", headers:this.$store.getters.authHeader})
          .then( resp => {
            this.$store.dispatch('USER_OBSERVATIONS')
          })
        .catch( error => {
          console.error(error.response)
        })
      }
  }
}
</script>

<style scoped>
body {
      font-family: 'Lato', sans-serif;
}
button {
  margin: 0 0.5rem 0 0;
}

input {
  margin: 0;
}

.empty-table {
  text-align: center;
}
</style>
