<template>
  <div id="login-form"  v-if="!isAuthenticated">
    <form @submit.prevent="login">

      <label class="label">Username</label>
      <input
        ref="first"
        type="text"
        :class="{ 'has-error': submitting && invalidUsername }"
        class="input"
        v-model="username"
      >
      <label class="label">Password</label>
      <input
        type="password"
        :class="{ 'has-error': submitting && invalidPassword }"
        class="input"
        v-model="password"
      >
      <p
        v-if="errorMessage"
        class="error-message"
      >{{errorMessage}}</p>
      <p
        v-if="error && submitting"
        class="error-message"
      >❗Please fill out all required fields</p>
      <p
        v-if="success"
        class="success-message"
      >✅ Log in successful</p>
      <button class="button">Login</button>
    </form>

  </div>
</template>

<script>
import { AUTH_REQUEST } from "actions/auth";
import { mapGetters } from "vuex";

export default {
  name: 'login-form',
  props: {
    loggedin: Boolean,
  },
    data () {
        return {
            username: '',
            password: '',
            submitting: false,
            loading: false,
            success:false,
            error: ''
        }
    },
    created () {
        // reset login status
        this.$emit('logout:user')
    },
    computed: {
      invalidPassword() {
        return this.password === ''
      },
      invalidUsername() {
        return this.username === ''
      },
      ...mapGetters(["isAuthenticated","errorMessage"])
    },
    methods: {
       login: function () {
         const { username, password } = this
         if (!(username && password)) {
             return;
         }
         this.$store.dispatch(AUTH_REQUEST, { username, password })
      }
    }

};
</script>

<style scoped>
body {
      font-family: 'Lato', sans-serif;
}
form {
  margin-bottom: 2rem;
}

[class*="-message"] {
  font-weight: 500;
}

.error-message {
  color: #d33c40;
}

.success-message {
  color: #32a95d;
}
</style>
