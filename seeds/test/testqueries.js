var appEnvironment = process.env.NODE_ENV || 'development';
var express = require('express'),
    config = require('../../config/config.js')(appEnvironment),
    glob = require('glob'),
    _ = require('underscore'),
    fs = require('fs'),
    mongoose = require('mongoose');

//Loading constants
require(config.root + '/config/constants');

//Loading Models
var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});

//MongoDB Connection
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

//var userBehavior = mongoose.model('UserBehavior');
//
//var behaviorsList = function behaviorsList() {
//  userBehavior.find({}, function (err, behaviors) {
//    console.log(behaviors);
//  });
//};

var survey = mongoose.model('Survey');

var surveyList = function surveyList() {
  survey.find({}, function (err, surveys) {
    console.log(surveys);
  });
};

var user = mongoose.model('User');

var usersList = function usersList() {
  user.find({}, function (err, users) {
    var employees = _.filter(users, function (user) {
      return (user.role == 'Team Member')
    });

    console.log(_.pluck(employees, 'role'));
  });
};

var Notification = mongoose.model('Notification');

var surveyRemindersDelete = function surveyRemindersDelete() {
  Notification.remove({'type.notificationType': 'SurveyReminder'},
      function (err, notifications) {

        if (!err) {
          console.log('successfully deleted');
        }
      })
};

var unReadNotifications = function unReadNotifications() {
  Notification.find({},
      function (err, notifications) {

        _.each(notifications, function(notification){
          notification.read = false;
          notification.save(function(){
            console.log('read')
          })
        });

        if (!err) {
          console.log('successfully deleted');
        }
      })
};

var getQuestions = function getQuestions(){
  var Question = mongoose.model('Question');

  var questionIds = [ "ObjectId('575939bb9d39460714cabc11')", '575939bb9d39460714cabc12' ];

  Question.find({_id: {$in: questionIds}}, function(err, questions){
    console.log(questions);
  })
}()
