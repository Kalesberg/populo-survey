var appEnvironment = process.env.NODE_ENV || 'development';
var express = require('express');
var glob = require('glob');
var _ = require('underscore');
var mongoose = require('mongoose');
var config = require('../../config/config.js')(appEnvironment);

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

var surveyReports = function () {
  var User = mongoose.model('User');
  var Survey = mongoose.model('Survey');

  Survey.find({state: 'started'}, function (err, surveys) {
    _.each(surveys, function (survey) {
      _.each(survey.assignees, function (userDoc) {
        User.findOne({_id: userDoc._id}, function(err, user){
          if(user){
            var url = "http://localhost:3000/generate-report/" + userDoc._id;
            user.generateReport();
          }
        })
      });
    });
  });
}();

//var updateSurveyProgress = function(){
//  var Submission = mongoose.model('Submission');
//  var Survey = mongoose.model('Survey');
//
//  Submission.find({}, function(err, submissions){
//    _.each(submissions, function(submission){
//      if(submission){
//        submission.updated_at = new Date();
//        submission.save(function(err, doc){
//          if(!err){
//            console.log('save')
//          }
//        });
//      }
//    })
//  });
//
//    Survey.find({}, function(err, surveys){
//      _.each(surveys, function(survey){
//        if(survey){
//        console.log(survey.overallProgress);
//        }
//      })
//    });
////}();
//};
