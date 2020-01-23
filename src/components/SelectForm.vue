<template>
  <div id="select-form" >
    <div class="field" v-if="loggedin == true">
    <h3 class="is-size-4">Project: {{proposalName}}</h3>
    <p><a v-on:click="resetProposal" v-show="proposalName" class="is-size-7">[change]</a></p>
    <div class="control" v-show="!proposalName">
      <div class="select">
      <select v-model="proposalid" @change="setProposal">
      <option disabled value="">Select your project</option>
      <option v-for="proposal in proposals"
        v-bind:value="proposal.value"
        v-bind:key="proposal.id"
        >
        {{proposal.text}}
      </option>
      </select>
    </div>
    </div>
  </div>

    <div class="buttons"  v-show="mode =='start'">
          <button v-on:click="setMode('select')" class="button">Suggestions</button>
          <button v-on:click="setMode('manual')"  class="button">Catalog LookUp</button>
    </div>
  </div>

</template>
<script>
export default {
  name: 'select-form',
  props: {
    loggedin: Boolean,
    message: String,
    mode: String,
    proposals: Array,
    default_proposal:String
  },
    data () {
        return {
          proposalid:'',
          error: '',
          name:'',
          modes:[{id:'select', 'name':'Suggest a target'},{id:'manual','name':'Manual input'}]
        }
    },
    computed: {
      proposalName(){
        for (var i=0;i<this.proposals.length;i++){
            if (this.proposals[i].value == this.default_proposal){
              this.error = ''
              return this.proposals[i].text
            }
        };
      },
    },
    methods: {
      setProposal() {
        this.$emit('changeproposal',this.proposalid)
      },
      resetProposal() {
        this.proposalid = undefined
        this.$emit('changeproposal',undefined)
      },
      setMode(data) {
        this.$emit('changemode', data)
      }
    }
  }
  </script>
  <style scoped>
  body {
        font-family: 'Lato', sans-serif;
  }
ul {
    list-style-type: none;
  }
  </style>
