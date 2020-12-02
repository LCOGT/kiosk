import axios from 'axios'

const apiCall = ({ url, method, data}) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        axios.defaults.headers.common['Authorization'] = 'Token '+ localStorage.getItem('user-token');
        axios({url: url, data: data, method: method })
      } catch (err) {
        reject(new Error(err));
      }
    }, 1000);
  });

  const getObservations = ({next, prev, target_name}) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
      try {
        var url = `https://observe.lco.global/api/requestgroups/?user=${state.user.profile.user}`

        if (this.next_obs && next){
          url = this.next_obs
        }else if (this.prev_obs && prev){
          url = this.prev_obs
        }else if (target_name) {
          url = `${url}&target=${target_name}`
        }
        axios.defaults.headers.common['Authorization'] = 'Token '+ localStorage.getItem('user-token');
        axios({url:url, method:'GET'})
      } catch (error) {
        console.log(error)
        reject(new Error(error));
      }
    }, 1000);
});


export default apiCall;
