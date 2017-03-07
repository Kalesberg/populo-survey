var appEnvironment = process.env.NODE_ENV || 'development';
var express = require('express'),
    config = require('../config/config.js')(appEnvironment),
    glob = require('glob'),
    _ = require('underscore'),
    mongoose = require('mongoose');
    events = require('events'),
    helper = require('../config/helper.js'),
    serverEmitter = new events.EventEmitter();

//Loading Models
var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model)(serverEmitter);
});

//MongoDB Connection
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var seedUsers = function () {
  console.log('Generating Users ....');
  var User = mongoose.model('User'),
  newUser = new User();
  var password = 'admin';

  newUser.full_legal_name = 'admin';
  newUser.encrypted_password = helper.encryptPassword(password);
  newUser.job_family = 'admin dept';
  newUser.job_profile = 'job profile admin';
  newUser.employee_id = '0000';
  newUser.manager_id = '10000';
  newUser.email = 'dev.populo@gmail.com';

  User.remove().exec(function () {
    User.registerUser(newUser, 'Leader');
  });
}();

var generateUsers = function () {
  var users = ['user1', 'user2', 'user3', 'user4', 'user5'];
  var hrs = ['hrmanager'];
  var teamLeaders = ['leader'];
  var managers = ['manager'];
  var User = mongoose.model('User');

  _.each(users, function (userName, index) {
    var newUser = new User();
    var password = 'u'+(parseInt(index+1)).toString();

    newUser.full_legal_name = userName;
    newUser.encrypted_password = helper.encryptPassword(password);
    newUser.job_family = 'user dept';
    newUser.job_profile = 'job profile Employee ' + (index+1);
    newUser.employee_id = '001'+index;
    newUser.manager_id = '0070';
    newUser.manager_full_name = 'manager';
    newUser.manager_full_legal_name = 'manager';
    newUser.ancestors = ['0070', '0080'];    
    newUser.email = 'dev.populo@gmail.com';
    
    User.registerUser(newUser, 'Employee');
  });

  _.each(hrs, function (hrName, index) {
    var newUser = new User();
    var password = 'hr';

    newUser.full_legal_name = hrName;
    newUser.encrypted_password = helper.encryptPassword(password);
    newUser.job_family = 'hr dept';
    newUser.job_profile = 'job profile HR ' + (index+1);
    newUser.employee_id = '002'+index;
    newUser.manager_id = '0080';
    newUser.ancestors = ['0080'];
    newUser.manager_full_name = 'leader';
    newUser.manager_full_legal_name = 'leader';
    newUser.email = 'dev.populo@gmail.com';
    
    User.registerUser(newUser, 'HR Manager');
  });

  _.each(managers, function (managerName, index) {
    var newUser = new User();
    var password = 'mr';

    newUser.full_legal_name = managerName;
    newUser.encrypted_password = helper.encryptPassword(password);
    newUser.job_family = 'manager dept';
    newUser.job_profile = 'job profile manager ' + (index+1);
    newUser.employee_id = '007'+index;
    newUser.manager_id = '0080';
    newUser.ancestors = ['0080'];
    newUser.manager_full_name = 'leader';
    newUser.manager_full_legal_name = 'leader';
    newUser.email = 'dev.populo@gmail.com';
    
    User.registerUser(newUser, 'Manager');
  });

  _.each(teamLeaders, function (teamleaderName, index) {
    var newUser = new User();
    var password = 'lr';

    newUser.full_legal_name = teamleaderName;
    newUser.encrypted_password = helper.encryptPassword(password);
    newUser.job_family = 'leader dept';
    newUser.job_profile = 'job profile leader ' + (index+1);
    newUser.employee_id = '008'+index;
    newUser.manager_id = '0000';
    newUser.manager_full_name = 'Admin';
    newUser.manager_full_legal_name = 'Admin';
    newUser.ancestors = ['0000'];
    newUser.email = 'dev.populo@gmail.com';
    
    User.registerUser(newUser, 'Leader');
  });
}();
