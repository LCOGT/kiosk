import { USER_REQUEST, USER_OBSERVATIONS, USER_OBS_SUCCESS, USER_ERROR, USER_SUCCESS } from "../actions/user";
import Vue from "vue";
import { AUTH_LOGOUT } from "../actions/auth";
import apiCall from "utils/api";
import axios from 'axios'

const state = { status: "", profile: {}, observations:{}, mode:'' };

const getters = {
  getMode: state => state.mode,
  getProfile: state => state.profile,
  proposalsLoaded: state => !!state.profile.proposals,
  defaultProposal: state => state.profile.default_proposal,
  currentProposalName (state) {
    if (state.profile.proposals == undefined){
      return null
    }
    for (var i=0;i<state.profile.proposals.length;i++){
        if (state.profile.proposals[i].value == state.profile.default_proposal){
          return state.profile.proposals[i].text
        }
    }
  },
};

const actions = {
  [USER_REQUEST]: ({ commit, dispatch }) => {
    commit(USER_REQUEST);
    axios.defaults.headers.common['Authorization'] = 'Token '+ localStorage.getItem('user-token');
    axios({url: 'https://observe.lco.global/api/profile', method:"GET"})
      .then(resp => {
        var proposals = new Array;

        for (var i=0; i<resp.data.proposals.length;i++){
          if (resp.data.proposals[i].current){
            proposals.push({'text':resp.data.proposals[i].title,'value':resp.data.proposals[i].id})
          }
        }
        var default_proposal;
        if (proposals.length == 1){
          default_proposal = proposals[0]
        }
        var data = {
          'user':resp.data.username,
          'default_proposal': default_proposal,
          'archive' : resp.data.tokens.archive,
          'proposals' : proposals
       }
        commit(USER_SUCCESS, data);
      })
      .catch((err) => {
        console.log(err)
        commit(USER_ERROR);
        // if resp is unauthorized, logout, to
        dispatch(AUTH_LOGOUT);
      });
  },
  [USER_OBSERVATIONS]: ({ commit, dispatch }) => {
    commit(USER_OBSERVATIONS);
    axios.defaults.headers.common['Authorization'] = 'Token '+ localStorage.getItem('user-token');
    var url = `https://observe.lco.global/api/requestgroups/?user={state.user}`;
    if (this.next_obs && next){
      url = this.next_obs
    }else if (this.prev_obs && prev){
      url = this.prev_obs
    }else if (target_name) {
      url = `${url}&target=${target_name}`
    }
    axios({url: 'https://observe.lco.global/api/profile', method:"GET"})
      .then(resp => {
        var data = {
          'user':resp.data.username,
          'default_proposal': default_proposal,
          'archive' : resp.data.tokens.archive,
          'proposals' : proposals
       }
        commit(USER_OBS_SUCCESS, data);
      })
      .catch((err) => {
        console.log(err)
        commit(USER_ERROR);
        // if resp is unauthorized, logout, to
        dispatch(AUTH_LOGOUT);
      });
  }
};

const mutations = {
  [USER_REQUEST]: state => {
    state.status = "loading";
  },
  [USER_OBSERVATIONS]: state => {
    state.status = "requesting";
  },
  [USER_OBS_SUCCESS]: (state, data) => {
    state.status = "success";
    state.observations = data;
  },
  [USER_SUCCESS]: (state, data) => {
    state.status = "success";
    state.profile = data;
  },
  [USER_ERROR]: state => {
    state.status = "error";
  },
  [AUTH_LOGOUT]: state => {
    state.profile = {};
  },
  changeProposal : (state, proposal_id) => {
    state.profile.default_proposal = proposal_id
  },
  resetProposal : state => {
    state.profile.default_proposal = ''
  },
  modeManual: state => {
    state.mode = 'manual'
  },
  modeSelect: state => {
    state.mode = 'select'
  },
  modeStart: state => {
    state.mode = 'start'
  },
  modeReset: state => {
    state.mode = ''
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
