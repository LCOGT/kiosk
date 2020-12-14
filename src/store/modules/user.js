import { USER_REQUEST, USER_OBSERVATIONS, USER_OBS_SUCCESS, USER_ERROR, USER_SUCCESS } from "../actions/user";
import Vue from "vue";
import { AUTH_LOGOUT } from "../actions/auth";
import apiCall from "utils/api";
import axios from 'axios';

const state = { status: "", profile: {}, observations:{}, mode:'', messages:{'error':'','info':''} };

const getters = {
  getMode: state => state.mode,
  getProfile: state => state.profile,
  proposalsLoaded: state => !!state.profile.proposals,
  defaultProposal: state => state.profile.default_proposal,
  getInfo: state => state.messages.info,
  getError: state => state.messages.error,
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
    var headers = {'Authorization' : 'Token '+ localStorage.getItem('user-token')};
    axios({url: 'https://observe.lco.global/api/profile/', method:"GET", headers: headers})
      .then(resp => {
        var proposals = new Array;

        for (var i=0; i<resp.data.proposals.length;i++){
          if (resp.data.proposals[i].current){
            proposals.push({'text':resp.data.proposals[i].title,'value':resp.data.proposals[i].id})
          }
        }
        var default_proposal;
        if (proposals.length == 1){
          default_proposal = proposals[0].value
        }
        var data = {
          'user':resp.data.username,
          'default_proposal': default_proposal,
          'proposals' : proposals
       }
       commit(USER_SUCCESS, data);
       dispatch(USER_OBSERVATIONS);
       commit('modeStart')
      })
      .catch((err) => {
        console.log(err)
        commit(USER_ERROR);
        // if resp is unauthorized, logout, to
        dispatch(AUTH_LOGOUT);
      });

  },
  [USER_OBSERVATIONS]: ({ commit, dispatch, getters }, payload) => {
    commit(USER_OBSERVATIONS);
    var url = 'https://observe.lco.global/api/requestgroups/?user=' + getters.getProfile.user;
    if (payload != undefined){
      if (payload.next != undefined){
        url = payload.next
      }else if (payload.prev!= undefined){
        url = payload.prev
      }else if (payload.target!= undefined) {
        url = `${url}&target=${payload.target}`
      }
    }
    axios({url: url, method:"GET", headers:getters.authHeader})
      .then(resp => {
        commit(USER_OBS_SUCCESS, resp.data);
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
  },
  updateInfo: (state, msg) => {
    state.messages.info = msg
  },
  updateError: (state, msg) => {
    state.messages.error = msg
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
