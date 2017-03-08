'use strict';

var mongoose = require('mongoose'),
    _ = require('underscore'),
    Schema = mongoose.Schema;

module.exports = function(serverEmitter){

  //const bluebird = require('bluebird');
  //mongoose.Promise = bluebird;

  var fields = {
    assessments: [],
    manager_assessments: [],
    team_leader_assessments: [],
    assignees: [],
    createdUser: {},
    raters: [],
    assignManager: [],
    isSharedWithManager: {
      type: Boolean,
      default: false
    },
    archive: {
      type: Boolean,
      default: false
    },
    expiry_date: {
      type: Date
    },
    availableRaters: [],
    availableAssessmentForRaters: [],
    availableAssessmentForTeamMember: [], 
    name: {
      type: String
    },
    state: {
      type: String,
      enum: ['not_started', 'started', 'completed']
    },
    overallProgress: {
      type: Number,
      default: 0
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    userStats: [],
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template'
    }
  };

  var surveySchema = new Schema(fields);

  surveySchema.methods.getManagerStats = function getManagerStats(manager, users){
    var userNames = _.pluck(users, 'full_legal_name');

    return _.filter(this.userStats, function(stat){
      return _.includes(userNames, stat.name);
    })
  };

  surveySchema.methods.regenerateUserStats = function regenerateUserStats(){
    var _this = this;
    var Submission = mongoose.model('Submission');

    Submission.find({survey: _this._id}, function(err, submissions){

      if(submissions.length == 0){
        _this = _this.generateEmptyUserStats();

        _this.save(function(err, doc){
          console.log('Generate User Stats');
        })
      }else{
        _.each(submissions, function(submission){
          Submission.updateUserProgress(submission);
        })
          }
    })
  };

  surveySchema.methods.generateEmptyUserStats = function generateEmptyUserStats(){
    var users = this.assignees;
    this.userStats = _.map(users, function (user) {
      return {name: user.full_legal_name, state: 'Not Started', no_of_submissions: 0}
    });

    return this;
  };

  surveySchema.methods.addAssessments = function  addAssessments(assessments, role){
    if(role == 'leader'){
      this.team_leader_assessments = assessments;
    }else if(role == 'manager'){
      this.manager_assessments = assessments;
    }else{
      this.assessments = assessments;
    }

    return this;
  };

  surveySchema.methods.expiry_date_format = function expiry_date_format(){
    var moment = require('moment');
    var _this = this;
    var date = new Date(_this.expiry_date);
    
    return this.expiry_date == undefined ? '' : moment(_this.expiry_date).format('MMM DD, YYYY h:mm');
    //  return 
  };

  surveySchema.methods.isExpiry = function isExpiry(){
    var expiry_date = new Date(this.expiry_date);
    if(expiry_date  == undefined){
      return false;
    }else{
      return ( expiry_date < new Date());
    }
  };

  surveySchema.methods.getAssessments = function getAssessments(user) {
    var assessments = [];

    if (user.userType == 'Manager' || user.userType == 'HR Manager') {
      assessments = this.manager_assessments;
    } else if (user.userType == 'Leader') {
      assessments = this.team_leader_assessments;
    } else {
      assessments = this.assessments;
    }

    return assessments;
  };

  surveySchema.methods.getRaterAssessments = function getRaterAssessments(user, bTeamRaters){
    var assessments = [];
    assessments = bTeamRaters ? this.availableAssessmentForTeamMember : this.availableAssessmentForRaters;
    return assessments;
  };

  surveySchema.methods.setProgress = function setProgress() {
    var _this = this;
    var Submission = mongoose.model('Submission');
    var totalSubscribedUsers = _this.assignees;
    var totalSubscriberRoles = _.filter(totalSubscribedUsers, 'userType');
    var assessmentsCount = _this.assessments.length;
    var managerAssessmentsCount = _this.manager_assessments.length;
    var teamLeaderAssessmentsCount = _this.team_leader_assessments.length;

    var managerCount = _.filter(totalSubscriberRoles, 'Manager').length;
    var leaderCount = _.filter(totalSubscriberRoles, 'Leader').length;
    var employeesCount = (totalSubscriberRoles.length - (managerCount + leaderCount));

    var totalExpectedSubmissionManagerCount = managerAssessmentsCount * managerCount;
    var totalExpectedSubmissionLeaderCount = teamLeaderAssessmentsCount * leaderCount;
    var totalExpectedSubmissionEmployeeCount = assessmentsCount * employeesCount;

    Submission.find({survey: this._id}).exec(function (err, submissions) {

      var expectedCount = totalExpectedSubmissionEmployeeCount +
          totalExpectedSubmissionLeaderCount +
          totalExpectedSubmissionManagerCount;

      var totalSubmissionsCount = submissions.length;

      _this.overallProgress = totalSubmissionsCount / submissions.length;

      _this.save(function (err, doc) {
        if (!err) {
          console.log('survey progress updated');
        }
      });
    })
  };

  surveySchema.methods.generateUserProgress = function generateUserProgress(){
    var _this = this;
    var User = mongoose.model('User');

    var employeeIds = _.pluck(_this.assignees, 'employee_id');

    User.find({employee_id: {$in: employeeIds}}, function(err, emps){
      _.each(emps, function(emp){
        if(emp.userType == 'Manager'){
          emp.updateManagerProgress(_this);
        }
      })
        });
  };

  surveySchema.methods.getQuestionsAndAnswers = function getQuestionsAndAnswers() {
    var answeredQuestions = _.filter(this.optionsSaved, function (qa) {
      return !(qa.selectedNA);
    });

    var questions = _.pluck(answeredQuestions, 'question');
    var answers = _.pluck(answeredQuestions, 'selectedOption');

    return {"questions": questions, "answers": answers};
  };

  surveySchema.methods.surveyReminder = function surveyReminder(sender, notifier) {
    var Notification = mongoose.model('Notification');
    var newNotification = new Notification();

    newNotification.title = 'Submit Reminder';
    newNotification.text = 'Submit Survey';
    newNotification.url = '/notifications/' + newNotification._id;
    newNotification.notifierId = notifier._id;
    newNotification.type = {
      initiatorId: sender._id,
      notifierId: notifier._id,
      typeId: this._id,
      notificationType: 'SurveyReminder'
    };

    newNotification.save(function (err, notification) {
      console.log('Notification Placed successfully -> ' + notification._id);
      serverEmitter.emit('newNotification', notification); 
    });
  };

  surveySchema.methods.submissionNotificationRead = function submissionNotificationRead(userId) {
    var Notification = mongoose.model('Notification');

    Notification.findOne({'type.notificationType': 'Survey', notifierId: userId, 'type.typeId': this._id},
                         function (err, notification) {

                           if (notification) {
                             //          Survey Reminder Notification
                             //          notification.readNotification();
                           }
                         })
  };

  surveySchema.methods.status = function status(user, step) {
    var Assessment = mongoose.model('Assessment');
    var assessments = this.getAssessments(user);

    var questionsCount = _.flatten(_.map(assessments, function (assessment) {
      return assessment.questions;
    })).length;

    var completedQuestions = _.flatten(_.map(assessments.slice(0, step + 1), function (assessment) {
      return assessment.questions;
    })).length;

    var percent = (completedQuestions / questionsCount) * 100;

    return {questionsCount: questionsCount, completedQuestions: completedQuestions, percent: percent};
  };

  surveySchema.methods.statusRater = function statusRater(user, step, bTeamRaters){
    var Assessment = mongoose.model('Assessment');
    var raterAssessments = this.getRaterAssessments(user, bTeamRaters);

    var questionsCount = _.flatten(_.map(raterAssessments, function (assessment) {
      return assessment.questions;
    })).length;

    var completedQuestions = _.flatten(_.map(raterAssessments.slice(0, step + 1), function (assessment) {
      return assessment.questions;
    })).length;

    var percent = (completedQuestions / questionsCount) * 100;

    return {questionsCount: questionsCount, completedQuestions: completedQuestions, percent: percent};
  };

  surveySchema.methods.sendNotifications = function sendNotifications(users) {
    var _this = this;

    var Notification = mongoose.model('Notification');
    var SurveyRaters = mongoose.model('SurveyRaters');
    var SelectedRaters = mongoose.model('SelectedRaters');

    _.each(users, function (user) {
      var newNotification = new Notification();

      newNotification.title = 'Survey';
      newNotification.text = 'Click here to complete your growth survey';
      newNotification.url = '/notifications/' + newNotification._id;
      newNotification.notifierId = user._id;
      newNotification.read = false;
      newNotification.type = {
        initiatorId: user._id,
        notifierId: user._id,
        typeId: _this._id,
        notificationType: 'Survey'
      };

      newNotification.save(function (err, notification) {
        console.log('Notification Placed successfully -> ' + notification._id);
        serverEmitter.emit('newNotification', notification); 
      });
      
      //if (user.role == 'Employee') {
      var newNotification1 = new Notification();
      newNotification1.title = 'Multi-Raters selection';
      newNotification1.text = 'Click here to select multi-raters for your growth survey';
      newNotification1.url = '/notifications/' + newNotification1._id;
      newNotification1.notifierId = user._id;
      newNotification1.read = false;
      newNotification1.type = {
        initiatorId: user._id,
        notifierId: user._id,
        typeId: _this._id,
        notificationType: 'Multi-Raters-Selection'
      };
      
      newNotification1.save(function (err, notification) {
        console.log('Notification Placed successfully -> ' + notification._id);
        serverEmitter.emit('newNotification', notification); 
      });
      //}
    });
  };

  return mongoose.model('Survey', surveySchema);
};

