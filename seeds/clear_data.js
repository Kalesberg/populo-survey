var appEnvironment = process.env.NODE_ENV || 'development';
var express = require('express'),
    config = require('../config/config.js')(appEnvironment),
    glob = require('glob'),
    _ = require('underscore'),
    fs = require('fs'),
    mongoose = require('mongoose');
    events = require('events'),
    serverEmitter = new events.EventEmitter();

//Loading constants
require(config.root + '/config/constants');

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

var User = mongoose.model('User');
var Survey = mongoose.model('Survey');
var Submission = mongoose.model('Submission');
var Notification = mongoose.model('Notification');
var SurveyRaters = mongoose.model('SurveyRaters');
var SelectedRaters = mongoose.model('SelectedRaters');
var Question = mongoose.model('Question');
var Assessment = mongoose.model('Assessment');
var SubmissionRaters = mongoose.model('SubmissionRaters');
var Answers = mongoose.model('Answer');
var Comments = mongoose.model('Comment');
var Questionbank = mongoose.model('Questionbank');
var Template = mongoose.model('Template');
var Growthplan = mongoose.model('Growthplan');
var GrowthplanItem = mongoose.model('GrowthplanItem');
var GrowthplanItemUserShare = mongoose.model('GrowthplanItemUserShare');

function clearData(){
  Survey.remove().exec(function () {
    console.log('Removing Surveys...');
  });

  Submission.remove().exec(function () {
    console.log('Removing Submissions...');
  });
  
  SubmissionRaters.remove().exec(function () {
    console.log('Removing SubmissionRaters...');
  });
  
  Answers.remove().exec(function () {
    console.log('Removing Answers...');
  });
  
  Comments.remove().exec(function () {
    console.log('Removing Comments...');
  });

  Notification.remove().exec(function () {
    console.log('Removing Notifications...');
  });

  SurveyRaters.remove().exec(function () {
    console.log('Removing Survey Raters...');
  });

  SelectedRaters.remove().exec(function () {
    console.log('Removing Selected Raters...');
  });

  Assessment.remove().exec(function () {
    console.log('Removing Assessments');
  });

  Question.remove().exec(function () {
    console.log('Removing Questions');
  });

  Questionbank.remove().exec(function () {
    console.log('Removing Questions Bank');
  });

  Template.remove().exec(function () {
    console.log('Removing Templates');
  });

  GrowthplanItemUserShare.remove().exec(function () {
    console.log('Removing GrowthplanItemUserShare');
  });

  GrowthplanItem.remove().exec(function () {
    console.log('Removing GrowthplanItem');
  });

  Growthplan.remove().exec(function () {
    console.log('Removing Growthplan');
  });
}

clearData();
