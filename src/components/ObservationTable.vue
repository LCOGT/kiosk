<template>
  <div id="observation-table" v-if="loggedin">
    <h1 class="is-size-2">Past Observations</h1>
    <p>
      <img :src="image.url" :alt="image.name"/>
    </p>
    <p
      v-if="observations.length < 1"
      class="empty-table"
    >
      No observations
    </p>
    <table v-else class="table is-fullwidth">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          :key="observation.id"
          v-for="observation in observations"
        >
          <td><a :href="'https://observe.lco.global/requestgroups/'+observation.id">{{observation.name}}</a></td>
          <td>{{observation.state}}
          <td v-if='observation.state=="PENDING"'>
            <button @click="$emit('delete:observation', observation.id)" class="button is-warning">Cancel</button>
          <td v-else-if='observation.state=="COMPLETED"'>
            <button @click="getframeid(observation.requests[0].id)" class="button is-info">Get Image</button>
          <td v-else>
          </td>

        </tr>
      </tbody>
    </table>

  </div>
</template>

<script>
export default {
  name: 'observation-table',
  props: {
    observations: Array,
    loggedin: Boolean,
  },
  data() {
    return {
      editing: null,
      image: {url:'',name:''},
    }
  },
  methods: {
    async getframeid(reqnum){
      var data
      console.log(reqnum)
      try {
          const response = await fetch(`https://archive-api.lco.global/frames/?ordering=-id&limit=1&REQNUM=${reqnum}`)
          data = await response.json()
          console.log(data)
          if (data.results != undefined && data.results.length >0){
             data = await this.getThumbnail(data.results[0].id)
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
