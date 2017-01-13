
function getRequests(){
  $.getJSON(apiRoot + 'api/user_requests/?submitter_id='+localStorage.getItem('username'), function(data){
    populateRequests(data);
  });
}

function populateRequests(data){
  var tmplt;
  var item
  for (var i = 0, len = data.results.length; i < len; i++){
    item = data.results[i];
    tmplt ="<li>"+item.tracking_number+" - "+item.state+"</li>";
    console.log(tmplt);
    $('#requests-container ul').append(tmplt);
  }
}

function getTargets(){
  var start = new Date();
  var end = new Date();
  var startstamp = start.toISOString().substring(0,19);
  end.setDate( end.getDate() + 7 );
  var endstamp = end.toISOString().substring(0,19);
  var url = 'https://lco.global/whatsup/search/v2/?start='+startstamp+'&aperture=0m4&end='+endstamp+'&format=jsonp';
  $.ajax({
    url: url,
    method: 'GET',
    cache: false,
    dataType: 'jsonp',
    context: this,
    error: function(){
      this.log('Error loading data from '+url);
    },
    success: function(data){
      target_list = data.targets;
      showTargets();
    }
  });
}

function showTargets(){
  var tmplt;
  var item
  for (var i = 0, len = target_list.length; i < len; i++){
    item = target_list[i];
    tmplt ="<li><a href='#' data-objectid="+i+" class='target-item'>"+item.name+"</a></li>";
    $('#requests-container ul').append(tmplt);
  }
}

function formatRequest(target){
  var target = createTarget(target);
  var exposures = createExposures(target);
  var ur = {
          "operator": "single",
          "type": "compound_request",
          "ipp_value":1.0,
          "requests": [
              {
                    "constraints": {
                        "max_airmass": 2.0
                    },
                    "location": {
                        "telescope_class": "0m4"
                    },
                    "molecules": exposures,
                    "observation_note": "Submitted through Kiosk",

                    "observation_type": "NORMAL",
                    "target": target,
                    "type": "request",
                    "windows": [
                        {
                            "end": "2017-01-13 08:19:45",
                            "start": "2017-01-20 02:33:24"
                        }
                    ]
                },
          ]
      }
      return ur;
}

function sendRequest(target){
  var url = apiRoot + 'service/request/submit';
  var ur = formatRequest(target);
  var data = {
    "request_data":ur,
    // "username": localStorage.getItem('username'),
    // "password": localStorage.getItem('password'),
    "proposal" : 'LCOEPO2014B-010'
  }
  $.ajax({
    url: url,
    method: 'POST',
    cache: false,
    data: ur,
    headers: {
        'Authorization':'Bearer ' + localStorage.getItem('token')
      },
    error: function(e){
      console.log('Error: '+e);
      var content = "<h3>Error!</h3><p>Sorry, there was a problem submitting your request. Please try later.</p>"
      $('#submit-modal-body').html(content);
      $('#submit-modal').modal('toggle');
    },
    success: function(data){
      var content = "<h3>Success!</h3><p>Your image will be ready in the next week.</p><img src='http://lcogt.net/files/edu/serol/serol_sm.png'>"
      $('#submit-modal-body').html(content);
      $('#submit-modal').modal('toggle');
    }
  });
}

function createTarget(obj){
  var target =
      {
      "coordinate_system": "ICRS",
      "dec": obj.dec,
      "epoch": 2000.0,
      "equinox": "J2000",
      "name": obj.name,
      "parallax": 0.0,
      "proper_motion_dec": 0.0,
      "proper_motion_ra": 0.0,
      "ra": obj.ra,
      "type": "SIDEREAL"
  }
  return target;
}

function createExposures(filters){
  var molecules = Array();
  var mol;
  for (var i = 0, len = filters.length; i < len; i++){
    mol =  {
            "bin_x": 2,
            "bin_y": 2,
            "exposure_count": 1,
            "exposure_time": filters[i].exposure,
            "filter": filters[i].name,
            "instrument_name": "0m4-SciCam-SBIG",
            "priority": 1,
            "type": "EXPOSE"
        }
    molecules.push(mol);
  }
  return molecules;
}
