<template>

  <div id="select-form" v-if="isAuthenticated">
    <div class="field">
    <h3 class="is-size-4">Project: {{currentProposalName}}</h3>
    <p><a v-on:click="resetProposal" v-show="currentProposalName" class="is-size-7">[change]</a></p>
    <div class="control" v-show="!defaultProposal">
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

  <div>
    <p>
      Logged in as: <em>{{getProfile.user}}</em> <a v-on:click="logout" class="is-size-7">[log out]</a>
    </p>
  </div>

    <div class="buttons"  v-show="getMode =='start'">
          <button v-on:click="setMode('modeSelect')" class="button">Suggestions</button>
          <button v-on:click="setMode('modeManual')"  class="button">Catalog LookUp</button>
    </div>
  </div>

</template>
<script>
import { mapState, mapGetters } from "vuex";


export default {
  name: 'select-form',

    data () {
        return {
          proposalid:'',
          error: '',
          name:'',
          modes:[{id:'select', 'name':'Suggest a target'},{id:'manual','name':'Manual input'}],
        }
    },
    computed: {
      ...mapGetters(["isAuthenticated","currentProposalName", "proposalsLoaded", "defaultProposal", "getProfile", "getMode"]),
      ...mapState({ proposals: state => state.user.profile.proposals })
    },

    methods: {
      setProposal() {
        this.$store.commit("changeProposal", this.proposalid);
        this.$store.commit("modeStart")
      },
      resetProposal() {
        this.proposalid = undefined
        this.$store.commit("resetProposal")
        this.$store.commit("modeReset")
      },
      setMode(mode) {
        this.$store.commit(mode)
      },
      logout(){
        this.$store.dispatch('AUTH_LOGOUT')
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
