<template>
  <div class="buttons" id="select-form"  v-show="mode =='start'">
        <button v-on:click="setMode('select')" class="button">Select</button>
        <button v-on:click="setMode('manual')"  class="button">Manual</button>
  </div>

</template>
<script>
export default {
  name: 'select-form',
  props: {
    loggedin: Boolean,
    message: String,
    mode: String,
  },
    data () {
        return {
          error: '',
          name:'',
          modes:[{id:'select', 'name':'Suggest a target'},{id:'manual','name':'Manual input'}]
        }
    },
    methods: {
      setMode(data) {
        this.$emit('changemode', data)
      }
    }
  }
  </script>
  <style scoped>
ul {
    list-style-type: none;
  }
  </style>
