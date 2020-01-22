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
  if (observation.coords.filters.length>0){
    for (var i=0;i<observation.coords.filters.length;i++){
      configs.push({'filter': observation.coords.filters[i].name,
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
    configs = [
      {'filter':'rp', 'exposure':120},
      {'filter':'B', 'exposure':120},
      {'filter':'V', 'exposure':120}
    ]
  } else if (observation.type == 'non_sidereal'){
    try {
      configs = [planets[observation.name.toLowerCase()]]
    } catch(error) {
      configs = [{'filter':'u', 'exposure':0.1}]
    }
  } else {
    configs = [
      {'filter':'rp', 'exposure':90},
      {'filter':'B', 'exposure':90},
      {'filter':'V', 'exposure':90}
    ]
  }
  return configs
}

export function  buildRequest(observation){
  var target = buildTarget(observation)
  var configs = buildConfigs(observation)
  var times = setWindows()
  var constraints = constraints = {
    'max_airmass': 1.6,
    'min_lunar_distance': 30
  }
  var inst_configs = Array();
  for (var i=0;i<configs.length;i++){
      var conf = {
                'exposure_time': configs[i]['exposure'],
                'exposure_count': 1,
                'optical_elements': {
                    'filter': configs[i]['filter']
                }
            }
      inst_configs.push(conf)
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
    "start": times.start,
    "end": times.end
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
      "name": "kiosk-"+observation.name,
      "proposal": observation.proposal,
      "ipp_value": 1.05,
      "operator": "SINGLE",
      "observation_type": "NORMAL",
      "requests": [request],
  }
  return data
}

function setWindows() {
  var start = new Date();
  var end = new Date();
  start = start.toISOString().substring(0,19);
  end.setDate( end.getDate() + 7 );
  end = end.toISOString().substring(0,19);
  return {'start' : start, 'end':end}
}
