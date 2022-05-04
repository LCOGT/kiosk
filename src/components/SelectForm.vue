<template>

  <div id="select-form" v-if="isAuthenticated">

      <p>
        Logged in as: <em>{{getProfile.user}}</em> <a v-on:click="logout" class="is-size-7">[log out]</a>
      </p>

    <div class="fa-3x" v-show="!proposalsLoaded">
        <i class="fas fa-spinner fa-spin"></i>
    </div>

    <div class="field" v-show="proposalsLoaded">
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

  <div class="field" v-show="currentProposalName">
    <h3>Telescope Size: <span v-if="getProfile.aperture">{{getProfile.aperture.name}}</span></h3>
    <div v-show="showChangeAperture()"><a v-on:click="resetAperture" class="is-size-7">[change]</a></div>
    <div class="control" v-show="showSelectAperture()">
      <div class="select">
        <select v-model="apertureid" @change="setAperture">
          <option disabled value="">Select telescope class</option>
          <option v-for="aperture in getProfile.apertures"
            v-bind:value="aperture.id"
            >
            {{aperture.name}}
          </option>
        </select>
      </div>
    </div>
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
          apertureid:'',
          error: '',
          name:'',
          modes:[{id:'select', 'name':'Suggest a target'},{id:'manual','name':'Manual input'}],
        }
    },
    computed: {
      ...mapGetters(["isAuthenticated",
                     "currentProposalName",
                     "proposalsLoaded",
                     "defaultProposal",
                     "getProfile",
                     "getMode",
                     "defaultAperture",
                     "getApertures",
                     "showChangeAperture",
                     "showSelectAperture",
                     "getApertureName"]),
      ...mapState({ proposals: state => state.user.profile.proposals}),

    },

    methods: {
      setProposal() {
        this.$store.dispatch("CHANGE_PROPOSAL", this.proposalid);
      },
      setAperture() {
        this.$store.dispatch("CHANGE_APERTURE", this.apertureid);
        this.$store.commit("clearError")
      },
      resetProposal() {
        this.proposalid = undefined
        this.apertureid = undefined
        this.$store.commit("resetProposal")
        this.$store.commit("modeReset")
      },
      resetAperture(){
        this.apertureid = undefined
        this.$store.dispatch("CHANGE_APERTURE", this.apertureid);
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
