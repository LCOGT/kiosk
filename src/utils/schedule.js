function buildTarget(observation){
  var target;
  if (observation.type == 'sidereal'){
    target = {
      "type": "ICRS",
      "name": observation['name'],
      "ra": observation.coords['ra'],
      "dec": observation.coords['dec'],
      'epoch': 2000
    }
  } else {
    var epoch = observation.coords['epoch_jd'] - 2400000.5;
    target = {
      "type": "ORBITAL_ELEMENTS",
      "name": observation['name'],
      "epochofel": epoch,
      "scheme": "JPL_MAJOR_PLANET",
      "orbinc": observation.coords['inclination'],
      "longascnode": observation.coords['ascending_node'],
      "argofperih": observation.coords['argument_of_perihelion'],
      "meandist": observation.coords['semimajor_axis'],
      "eccentricity": observation.coords['eccentricity'],
      "meananom": observation.coords['mean_anomaly'],
      "dailymot":observation.coords['mean_daily_motion']
    }
  }
  return target
}

function buildConfigs(observation){
  var configs = Array()

  var telescopes = {'0M4-SCICAM-SBIG' : '0m4',
      '2M0-SCICAM-MUSCAT' : '2m0',
      '1M0-SCICAM-SINISTRO' : '1m0',
      '2M0-SCICAM-SPECTRAL' : '2m0',
    };
  configs.telescope = telescopes[observation.instrument];
  configs.filters = [];


  if (observation.coords.filters!=undefined && observation.coords.filters.length>0){
    for (var i=0;i<observation.coords.filters.length;i++){
      configs.filters.push({'filter': observation.coords.filters[i].name,
                    'exposure': observation.coords.filters[i].exposure})
    }
    return configs
  }
  var planets = {
    'jupiter' : {'filter':'up', 'exposure':0.2},
    'mars' : {'filter':'rp', 'exposure':1},
    'uranus' :{'filter':'rp', 'exposure':5},
    'neptune' : {'filter':'rp', 'exposure':5},
    'mercury' : {'filter':'rp', 'exposure':5},
    'saturn' :{'filter':'up', 'exposure':0.5},
    'venus' : {'filter':'up', 'exposure':0.1}
  }
  if (observation.name.toLowerCase().substring(0,3) == 'ngc'){
    configs.filters = [
      {'filter':'rp', 'exposure':120},
      {'filter':'B', 'exposure':120},
      {'filter':'V', 'exposure':120}
    ]
  } else if (observation.type == 'non_sidereal'){
    try {
      configs.filters = [planets[observation.name.toLowerCase()]]
    } catch(error) {
      configs.filters = [{'filter':'u', 'exposure':0.1}]
    }
  } else {
    configs.filters = [
      {'filter':'rp', 'exposure':90},
      {'filter':'B', 'exposure':90},
      {'filter':'V', 'exposure':90}
    ]
  }
  return configs
}

export function  buildRequest(observation){
  console.log(observation)
  if (observation.object_type == 'moon'){
    var data = {
      'data' : {
          'proposal'  : observation.proposal,
        },
      'url'  : 'https://serol.lco.global/api/schedule/moon/'
    }
    return data
  }

  var target = buildTarget(observation)
  var configs = buildConfigs(observation)
  var times = setWindows()
  var constraints = {
    'max_airmass': 1.6,
    'min_lunar_distance': 30
  }
  var inst_configs = Array();

  if (observation.instrument == '2M0-SCICAM-MUSCAT'){
    var conf = {
          "exposure_time": configs.filters[0]['exposure'],
          "exposure_count": 1,
          "mode": "MUSCAT_SLOW",
          "optical_elements": {
              "diffuser_g_position": "out",
              "diffuser_r_position": "out",
              "diffuser_i_position": "out",
              "diffuser_z_position": "out"
          },
          "extra_params": {
              "bin_x": 1,
              "bin_y": 1,
              "exposure_mode": "SYNCHRONOUS",
              "exposure_time_g": configs.filters[0]['exposure'],
              "exposure_time_r": configs.filters[0]['exposure'],
              "exposure_time_i": configs.filters[0]['exposure'],
              "exposure_time_z": configs.filters[0]['exposure']
          }
      }
      inst_configs.push(conf)
  } else {
    for (var i=0;i<configs.filters.length;i++){
        var conf = {
                  'exposure_time': configs.filters[i]['exposure'],
                  'exposure_count': 1,
                  'optical_elements': {
                      'filter': configs.filters[i]['filter']
                  }
              }
        inst_configs.push(conf)
    }
  }

  var config  = [{
        'type': 'EXPOSE',
        'instrument_type': observation.instrument,
        'target': target,
        'constraints': constraints,
        'acquisition_config': {},
        'guiding_config': {},
        'instrument_configs': inst_configs
    }]
  var timewindow = {
    "start": times.start,
    "end": times.end
    }
  var request = {
    "location":{"telescope_class":configs.telescope},
    "constraints":{"max_airmass":2.0},
    "target": target,
    "configurations": config,
    "windows": [timewindow],
    "observation_note" : "Kiosk",
    "type":"request"
  }
  var requestdata = {
      "name": "kiosk-"+observation.name,
      "proposal": observation.proposal,
      "ipp_value": 1.0,
      "operator": "SINGLE",
      "observation_type": "NORMAL",
      "requests": [request],
  }
  var data = {
    'observation' : requestdata,
    'url'  : 'https://observe.lco.global/api/requestgroups/'
  }
  return data
}

function setWindows() {
  var start = new Date();
  if ((start.getMonth() == 6 || start.getMonth() == 0) && start.getDate() >= 24){
    start.setDate(1)
    start.setMonth(start.getMonth()+1)
  }
  var end = new Date(start);
  end.setDate( start.getDate() + 7 );
  start = start.toISOString().substring(0,19);
  end = end.toISOString().substring(0,19);
  return {'start' : start, 'end':end}
}
