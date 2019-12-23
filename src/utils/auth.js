import { authHeader } from '.';

export const userAuth = {
    login,
    logout,
    getProposals,
    submit_to_serol,
};

function login(username, password) {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    };

    return fetch(`https://observe.lco.global/api/api-token-auth/`, requestOptions)
        .then(handleResponse)
        .then(user => {
            // login successful if there's a user in the response
            if (user) {
                // store user details and basic auth credentials in local storage
                // to keep user logged in between page refreshes
                user.token = window.btoa(username + ':' + password);


            }

            return user;
        });
}

function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('user');
}

function getProposals() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`https://observe.lco.global/api/profile/`, requestOptions).then(handleProfile);
}

function handleProfile(response){
  return response.text().then(text => {
    const data = text && JSON.parse(text);
    var proposals = new Array;
    for (var i=0; i<data.proposals.length;i++){
      if (data.proposals[i].current){
        proposals.push({'text':data.proposals[i].title,'value':data.proposals[i].id})
      }
    }
    return {'proposals' : proposals, 'archive' : data.tokens.archive}
  });
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                logout();
                location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}

function submit_to_serol(object, start, end){
  var target = {
    "type": "ICRS",
    "name": object['name'],
    "ra": object['ra'],
    "dec": object['dec'],
    'epoch': 2000
  }
  var constraints = constraints = {
    'max_airmass': 1.6,
    'min_lunar_distance': 30
  }
  var inst_configs = Array();
  for (var i=0;i<object['filters'].length;i++){
      var mol = {
                'exposure_time': object['filters'][i]['exposure'],
                'exposure_count': 1,
                'optical_elements': {
                    'filter': object['filters'][i]['name']
                }
            }
      inst_configs.push(mol)
  }
  var config  = [{
        'type': 'EXPOSE',
        'instrument_type': '0M4-SCICAM-SBIG',
        'target': target,
        'constraints': constraints,
        'acquisition_config': {},
        'guiding_config': {},
        'instrument_configs': inst_configs
    }]
  var timewindow = {
    "start": start,
    "end": end
    }
  var request = {
    "location":{"telescope_class":"0m4"},
    "constraints":{"max_airmass":2.0},
    "target": target,
    "configurations": config,
    "windows": [timewindow],
    "observation_note" : "Serol",
    "type":"request"
  }
  var data = {
      "name": "mb_"+start.substr(0,10)+"_"+object['m'],
      "proposal": localStorage.getItem("proposal_code"),
      "ipp_value": 1.05,
      "operator": "SINGLE",
      "observation_type": "NORMAL",
      "requests": [request],
  }
  const requestOptions = {
    type: 'POST',
    data: JSON.stringify(data),
    headers: authHeader(),
    dataType: 'json',
    contentType: 'application/json'}
  return fetch('https://observe.lco.global/api/userrequests/',requestOptions).then(handleSchedule);

}

function handleSchedule(response){
  return response.text().then(text => {
      const data = text && JSON.parse(text);
      if (!response.ok) {
        var msg;
        if (data['requests'][0]['non_field_errors'] != undefined){
          msg = data['requests'][0]['non_field_errors'][0];
        } else if (data['requests'][0]['windows'][0]['non_field_errors'] != undefined){
          msg = data['requests'][0]['windows'][0]['non_field_errors'][0];
        } else {
          msg = "An error occured.";
        }

        return Promise.reject(msg);
      }

      return "<h3>Success!</h3><p>Your image will be ready in the next week.</p><img src='https://lco.global/files/edu/serol/serol_looking_though_telescope_sm.png'>"
  });
}
