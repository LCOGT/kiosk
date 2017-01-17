/* globals $ rivetsBindings rivets apiRoot refreshTable */
'use strict';

var apiRoot = 'http://localhost:8000/';
var client_id = 'RDjxBxIQnEwZzDH6hL5w97kT7hREenR8Rzw5gwxQ';
var profile = {
  username: '',
  password:'',
};

// rivets.bind($('#profile'), profile);

// $.ajaxPrefilter(function(options, originalOptions, jqXHR){
//   if(options.url.indexOf('localhost:8000/') >= 0 && localStorage.getItem('token')){
//     jqXHR.setRequestHeader('Authorization', 'Token ' + localStorage.getItem('token'));
//   }
// });

function setHeader(xhr) {
  xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'));
}

function getProfile(password){
  $.ajax({
  url: apiRoot + 'api/profile/',
  type: 'GET',
  dataType: 'json',
  success: function() {
    profile.username = data.username || '';
    profile.password = password || '';
    localStorage.setItem('username', profile.username);
    localStorage.setItem('password', profile.password);
  },
  beforeSend: setHeader
});
}

function login(username, password, callback){
  $.post(
    apiRoot + 'api/api-token-auth/',
    {
      'username': username,
      'password': password,
      'client_id' : client_id,
      'grant_type': 'password'
    }
  ).done(function(data){
    localStorage.setItem('token', data.token);
    getProfile(password);
    getRequests();
    callback(true);
    $('#login-modal').modal('toggle');
  }).fail(function(){
    $('#login-error-msg').toggle();
  });
}

function logout(){
  localStorage.removeItem('token');
  profile.username = '';
}

$(document).ready(function(){


$('#logout-btn').click(function(){
  logout();
});

$('.alert .close').on('click', function(){
    $(this).parent().hide();
});
});
