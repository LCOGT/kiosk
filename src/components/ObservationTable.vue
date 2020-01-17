<template>
  <div id="observation-table" v-if="loggedin">
    <h1 class="is-size-2">Past Observations</h1>
    <div v-if="gettingimg === false && image.url">
      <img :src="image.url" :alt="image.name"/>
    </div>
    <div v-else-if="gettingimg === true">
        <div class="fa-3x">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
    </div>
    <p
      v-if="observations.length < 1"
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
          v-for="observation in observations"
        >
          <td><a :href="'https://observe.lco.global/requestgroups/'+observation.id">{{observation.requests[0].configurations[0].target.name}}</a></td>
          <td :title="observation.state"><i class='far' v-bind:class="statusIcon(observation.state)"></i>
          <td v-if='observation.state=="PENDING"'>
            <button @click="$emit('delete:observation', observation.id)" class="button is-warning">Cancel</button>
          <td v-else-if='observation.state=="COMPLETED"'>
            <button @click="getframeid(observation.requests[0].id)" class="button is-info">Get Image</button>
          <td v-else>
          </td>

        </tr>
      </tbody>
    </table>
    <div class="field is-grouped">
      <p class="control" v-if="prev_obs">
        <button @click="$emit('getobservations', false, true)" class="button">
        <span class="icon is-small">
          <i class="far fa-backward"></i>
        </span>
        <span>Previous</span>
      </button>
      </p>
      <p class="control" v-if="next_obs">
        <button @click="$emit('getobservations', true, false)" class="button">
          <span>Next</span>
          <span class="icon is-small">
            <i class="far fa-forward"></i>
          </span>
        </button>
      </p>
    </div>

  </div>
</template>

<script>
export default {
  name: 'observation-table',
  props: {
    observations: Array,
    loggedin: Boolean,
    next_obs: String,
    prev_obs: String
  },
  data() {
    return {
      gettingimg: null,
      image: {url:'',name:''},
    }
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
    async getframeid(reqnum){
      var data
      this.gettingimg = true
      try {
          const response = await fetch(`https://archive-api.lco.global/frames/?ordering=-id&limit=1&REQNUM=${reqnum}`)
          data = await response.json()
          console.log(data)
          if (data.results != undefined && data.results.length >0){
             data = await this.getThumbnail(data.results[0].id)
             this.gettingimg = false
             this.image.name = reqnum
             this.image.url = data['url']
             return
          }
      } catch(error){
        console.error(error)
        return '0'
      }
    },
    async getThumbnail(frameid) {
      var data
      try {
          const response = await fetch(`https://thumbnails.lco.global/${frameid}/?height=600&width=600&color=true`)
          data = await response.json()
          if (data.message == 'RVB frames not found'){
            const response = await fetch(`https://thumbnails.lco.global/${frameid}/?height=600&width=600`)
            data = await response.json()
          }
          return data
      } catch(error){
        console.error(error)
      }
    }
  }
}
</script>

<style scoped>
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
