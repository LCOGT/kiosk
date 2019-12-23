<template>
  <div id="observation-table" v-if="loggedin">
    <h1 class="is-size-2">Past Observations</h1>

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
          <td>{{observation.state}}</td>
          <td v-if='observation.state=="PENDING"'>
            <button @click="$emit('delete:observation', observation.id)" class="button is-warning">Cancel</button>
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
    }
  },
  methods: {
    editMode(observation) {
      this.cachedObservation = Object.assign({}, observation)
      this.editing = observation.id
    },

    cancelEdit(observation) {
      Object.assign(observation, this.cachedObservation)
      this.editing = null;
    },

    editObservation(observation) {
      if (observation.name === '' || observation.email === '') return
      this.$emit('edit:observation', observation.id, observation)
      this.editing = null
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
