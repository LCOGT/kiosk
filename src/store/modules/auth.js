/* eslint-disable promise/param-names */
import {
  AUTH_REQUEST,
  AUTH_ERROR,
  AUTH_SUCCESS,
  AUTH_LOGOUT,
  AUTH_ARCHIVE,
  ARCHIVE_SUCCESS
} from "../actions/auth";
import { USER_REQUEST } from "../actions/user";
import axios from 'axios'

const state = {
  token: localStorage.getItem("user-token") || "",
  status: "",
  hasLoadedOnce: false,
  archive_token: localStorage.getItem("archive-token") || "",
};

const getters = {
  isAuthenticated: state => !!state.token,
  authStatus: state => state.status,
  authHeader (state) {
    return { 'Authorization': 'Token '+state.token}
  },
  archiveHeader (state) {
    return { 'Authorization': 'Token '+state.archive_token}
  }
};

const actions = {
  [AUTH_REQUEST]: ({commit, dispatch}, user) => {
    return new Promise((resolve, reject) => { // The Promise used for router redirect in login
      commit(AUTH_REQUEST)
      axios({url: 'https://observe.lco.global/api/api-token-auth/', data: user, method: 'POST' })
        .then(resp => {
          const token = resp.data.token
          localStorage.setItem('user-token', token) // store the token in localstorage
          commit(AUTH_SUCCESS, token)
          // you have your token, now log in your user :)
          dispatch(AUTH_ARCHIVE, user)
          resolve(resp)
        })
      .catch(err => {
        commit(AUTH_ERROR, err)
        localStorage.removeItem('user-token') // if the request fails, remove any possible user token if possible
        reject(err)
      })
    })
  },
  [AUTH_ARCHIVE]: ({commit, dispatch}, user) => {
    return new Promise((resolve, reject) => { // The Promise used for router redirect in login
      commit(AUTH_ARCHIVE)
      console.log(user)
      axios({url: 'https://archive-api.lco.global/api-token-auth/', data: user, method: 'POST' })
        .then(resp => {
          const token = resp.data.token
          localStorage.setItem('archive-token', token) // store the token in localstorage
          commit(ARCHIVE_SUCCESS, token)
          // you have your token, now log in your user :)
          dispatch(USER_REQUEST)
          resolve(resp)
        })
      .catch(err => {
        commit(AUTH_ERROR, err)
        localStorage.removeItem('archive-token') // if the request fails, remove any possible user token if possible
        reject(err)
      })
    })
  },
  [AUTH_LOGOUT]: ({ commit }) => {
    return new Promise(resolve => {
      commit(AUTH_LOGOUT);
      localStorage.removeItem("user-token");
      localStorage.removeItem("archive-token");
      resolve();
    });
  }
};

const mutations = {
  [AUTH_REQUEST]: state => {
    state.status = "loading";
  },
  [AUTH_SUCCESS]: (state, token) => {
    state.status = "success";
    state.token = token;
    state.hasLoadedOnce = true;
  },
  [AUTH_ARCHIVE]: state => {
    state.status = "loading archive";
  },
  [ARCHIVE_SUCCESS]: (state, token) => {
    state.status = "success";
    state.archive_token = token;
  },
  [AUTH_ERROR]: state => {
    state.status = "error";
    state.hasLoadedOnce = true;
  },
  [AUTH_LOGOUT]: state => {
    state.token = "";
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
