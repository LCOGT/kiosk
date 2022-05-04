import { USER_REQUEST, USER_OBSERVATIONS, USER_OBS_SUCCESS, USER_ERROR, USER_SUCCESS, USER_PROPOSALS, USER_PROPOSAL_SUCCESS, CHANGE_APERTURE, CHANGE_PROPOSAL } from "../actions/user";
import Vue from "vue";
import { AUTH_LOGOUT } from "../actions/auth";
import apiCall from "utils/api";
import axios from 'axios';

const instrument_name = {
'0M4-SCICAM-SBIG' : '0.4 meter',
'2M0-SCICAM-MUSCAT' : '2m MuSCAT3',
'1M0-SCICAM-SINISTRO' : '1 meter',
'2M0-SCICAM-SPECTRAL' : '2 meter',
};

const state = {
          status: "",
          profile: {
              aperture:{'id':null,'name':null},
              apertures:[],
              proposals:[],
              time: [],
              default_proposal:''
            },
          observations:{},
          mode:'',
          messages:{'error':'','info':''}
        };

const getters = {
  getMode: state => state.mode,
  getProfile: state => state.profile,
  proposalsLoaded: state => !!state.profile.proposals,
  defaultProposal: state => state.profile.default_proposal,
  defaultAperture: state => state.profile.aperture,
  getApertures: state => state.profile.apertures,
  getInfo: state => state.messages.info,
  getError: state => state.messages.error,
  getApertureName: (state) => {
    if (state.profile.aperture != undefined){
      return state.profile.aperture.name
    } else {
      return null
    }
  },
  currentProposalName: (state) => {
    if (state.profile.proposals == undefined){
      return null
    }
    for (var i=0;i<state.profile.proposals.length;i++){
        if (state.profile.proposals[i].value == state.profile.default_proposal){
          return state.profile.proposals[i].text
        }
    }
  },
  showChangeAperture (state){
    return function(){
      if (state.profile.apertures && state.profile.apertures.length > 1 ){
          return true
      } else{
        return false
      }
    }
  },
  showSelectAperture (state){
    return function(){
      if (state.mode == '' && (!state.profile.aperture || !state.profile.aperture.id)){
        console.log('here')
        return true
      } else {
        return false
      }
    }
  }
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
        var default_proposal = '';
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
       dispatch(USER_PROPOSALS);
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
  },
  [USER_PROPOSALS]: ({ commit, dispatch, getters }) => {
    commit(USER_PROPOSALS);
    var url = 'https://observe.lco.global/api/proposals/?active=True&limit=100';
    axios({url: url, method:"GET", headers:getters.authHeader})
      .then(resp => {
        var proposals = new Array;
        var apertures;
        for (var i=0; i<resp.data.results.length;i++){
          apertures = [];
          if (resp.data.results[i].active){
            for (var j=0; j<resp.data.results[i].timeallocation_set.length;j++){
              apertures.push(resp.data.results[i].timeallocation_set[j].instrument_type)
            }
            proposals.push({'id':resp.data.results[i].id, 'apertures' :[...new Set(apertures)]})
          }
        }
        commit(USER_PROPOSAL_SUCCESS, proposals);
        if (proposals.length == 1) {
          commit("changeProposal", proposals[0].id)
        }
      })
      .catch((err) => {
        console.log(err)
        commit(USER_ERROR);
        // if resp is unauthorized, logout, to
        //dispatch(AUTH_LOGOUT);
      });
  },
  [CHANGE_PROPOSAL] : ({commit, state}, proposal_id) => {
    var ap = state.profile.time.find( ({ id }) => id === proposal_id );

    const good_apertures = ap.apertures.filter(function(ap){
      return instrument_name[ap] != undefined
    });
    good_apertures.sort();
    const apertures = good_apertures.map(function(ap){
      return {'id':ap, 'name':instrument_name[ap] }
    });


    commit('updateApertures', apertures);
    commit('setProposal',proposal_id)
    if (apertures.length == 1) {
      commit('setAperture', apertures[0]);
      commit('modeStart')
    }else{
      commit('resetAperture')
      commit('updateApertures', apertures);
      commit('modeReset');
    }
  },
  [CHANGE_APERTURE] : ({commit, state}, apertureid) =>{

    if (apertureid == undefined){
      name = undefined;
    } else {
      var name = state.profile.apertures.filter(ap => ap.id == apertureid);
      console.log(name)
      if (name == []){
        name = undefined;
      } else {
        name = name[0].name
      }
    }
    commit('setAperture', {id: apertureid, name: name});
    commit('modeStart');
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
  [USER_PROPOSALS]: state => {
    state.status = "requesting proposals"
  },
  [USER_PROPOSAL_SUCCESS]: (state, data) => {
    state.status = "success";
    state.profile.time = data;
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
  setAperture : (state, aperture) => {
    state.profile.aperture = aperture;
  },
  resetAperture : (state) => {
    state.profile.aperture = {id:null,name:null};
  },
  updateApertures : (state, apertures) => {
    state.profile.apertures = apertures;
  },
  setProposal : (state, proposalid) => {
    state.profile.default_proposal = proposalid;
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
  },
  clearError: (state) => {
    state.messages.error = ''
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
