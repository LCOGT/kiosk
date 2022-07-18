/* eslint-disable promise/param-names */
import {
  AUTH_REQUEST,
  AUTH_ERROR,
  AUTH_SUCCESS,
  AUTH_LOGOUT
} from "../actions/auth";
import { USER_REQUEST } from "../actions/user";
import axios from 'axios'

const state = {
  token: localStorage.getItem("user-token") || "",
  status: "",
  hasLoadedOnce: false,
  archive_token: localStorage.getItem("archive-token") || "",
  message:"",
};

const getters = {
  isAuthenticated: state => !!state.token,
  authStatus: state => state.status,
  errorMessage: state => state.message,
  authHeader (state) {
    return { 'Authorization': 'Token '+state.token}
  },
  archiveHeader (state) {
    return { 'Authorization': 'Token '+state.archive_token}
  }
};

const actions = {
  [AUTH_REQUEST]: ({commit, dispatch}, user) => {
    return new Promise(resolve => { // The Promise used for router redirect in login
      commit(AUTH_REQUEST)
      axios({url: 'https://observe.lco.global/api/api-token-auth/', data: user, method: 'POST' })
        .then((resp) => {
          commit('authErrorMsg', '')
          const token = resp.data.token
          localStorage.setItem('user-token', token) // store the token in localstorage
          commit(AUTH_SUCCESS, token)
          // you have your token, now log in your user :)
          dispatch(USER_REQUEST)
          resolve(resp)
        })
      .catch((err) => {
        commit(AUTH_ERROR)
        commit('authErrorMsg', err.response.data.non_field_errors[0])
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
  [AUTH_ERROR]: state => {
    state.status = "error";
    state.hasLoadedOnce = true;
  },
  [AUTH_LOGOUT]: state => {
    state.token = "";
  },
  authErrorMsg: (state, msg) => {
    state.message = msg;
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};
