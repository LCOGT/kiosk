/* globals $ rivetsBindings rivets apiRoot refreshTable */
'use strict';

var apiRoot = 'http://scheduler-dev.lco.gtn/observe/';
var client_id = 'RDjxBxIQnEwZzDH6hL5w97kT7hREenR8Rzw5gwxQ';
var profile = {
  username: '',
  password:'',
};

// rivets.bind($('#profile'), profile);

$.ajaxPrefilter(function(options, originalOptions, jqXHR){
  if(options.url.indexOf('lco.gtn/') >= 0 && localStorage.getItem('token')){
    jqXHR.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'));
  }
});

function setHeader(xhr) {
  xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'));
}

function getProfile(password){
  $.getJSON(apiRoot + 'api/profile/', function(data){
    profile.username = data.username || '';
    profile.password = password || '';
    localStorage.setItem('username', profile.username);
    localStorage.setItem('password', profile.password);
  });
}

function login(username, password, callback){
  $.post(
    apiRoot + 'o/token/',
    {
      'username': username,
      'password': password,
      'client_id' : client_id,
      'grant_type': 'password'
    }
  ).done(function(data){
    localStorage.setItem('token', data.access_token);
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
