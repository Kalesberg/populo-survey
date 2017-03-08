'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    helper = require('../../config/helper.js'),
    jade = require('jade'),
    _ = require('underscore');

module.exports = function(serverEmitter){
  var fields = {
    email: {
      type: String
    },
    encrypted_password: {
      type: String
    },
    superior_organization: {
      type: String
    },
    supervisory_reference_id: {
      type: String
    },
    supervisory_organization: {
      type: String
    },
    manager_location: {
      type: String
    },
    manager_id: {
      type: String
    },
    manager_full_name: {
      type: String
    },
    manager_full_legal_name: {
      type: String
    },
    job_family_group: {
      type: String
    },
    job_family: {
      type: String
    },
    job_profile: {
      type: String
    },
    employee_id: {
      type: String
    },
    user_name: {
      type: String
    },
    full_legal_name: {
      type: String
    },
    ancestors: [],
    type: {
      type: String
    },
    location: {
      type: String
    },
    role: {
      type: String,
      enum: ['HR Manager', 'Manager', 'Leader', 'Employee', 'Admin', 'Team Member']
    },
    userType: {
      type: String
    },
    avatar: {
      type: String,
      default: '/img/avatar-f-big.svg'
    },
    insights_on: {
      type: Boolean,
      default: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    survey_progress: [],
    is_original_record: {
      type: Boolean,
      default: false
    }
  };

  var userSchema = new Schema(fields);

  userSchema.statics.roles = function roles() {
    return ['HR Manager', 'Manager', 'Leader', 'Employee', 'Team Member'];
  };

  userSchema.methods.getManagerProgress = function getManagerProgress(survey) {
    var _this = this;
    var survey = survey;

    var surveyProgressIndex = _.findIndex(_this.survey_progress, function (progress) {
      return (progress.name == survey.name);
    });

    var surveyProgress = _this.survey_progress[surveyProgressIndex];

    return {progress: surveyProgress, index: surveyProgressIndex}
  };

  userSchema.methods.isManagerProgressEmpty = function isManagerProgressEmpty(survey) {
    return (this.getManagerProgress(survey)['index'] == -1);
  };

  userSchema.methods.sendGrowthPlanNotfication = function sendGrowthPlanNotfication(growthPlan, manager) {
    var _this = this;
    var Notification = mongoose.model('Notification');

    var notification = new Notification();

    notification.title = 'Growth Plan Report to Manager';
    notification.text = this.full_legal_name  + ' shared his/her growth plan.';
    notification.url = '/notifications/' + notification._id;
    notification.notifierId = manager._id;
    notification.read = false;
    notification.type = {
      initiatorId: _this._id,
      notifierId: manager._id,
      typeId: growthPlan._id,
      notificationType: 'GrowthPlan-Manager-Send-Report'
    };

    notification.save(function (err, notification) {
      console.log('Notification Placed successfully -> ' + notification._id);
      serverEmitter.emit('newNotification', notification);
    });
  };

  userSchema.methods.updateManagerProgress = function updateManagerProgress(survey) {
    var _this = this;
    var User = mongoose.model('User');

    // var surveyProgress = _this.survey_progress;
    var newSurveyProgress = {name: survey.name, progress: 0, _id: survey._id};
    var currentSurveyProgress = _this.getManagerProgress(survey);
    var progress = 0;

    User.find({manager_id: _this.employee_id}, function (err, employees) {
      //employees = _.sortBy(employees, 'full_legal_name');
      var userStats = survey.userStats;

      _.each(employees, function (employee) {
        var assessments = survey.getAssessments(employee);
        var assessmentsCount = assessments.length;

        _.each(userStats, function (stat) {
          if (stat.name == employee.full_legal_name) {
            progress = progress + (stat.no_of_submissions / assessmentsCount) * 100;
          }
        });
      });

      var totalManagerProgress = progress / employees.length;

      newSurveyProgress['progress'] = (totalManagerProgress > 100) ? 100 : totalManagerProgress;

      if (_this.isManagerProgressEmpty(survey)) {
        _this.survey_progress.push(newSurveyProgress);
      } else {
        _this.survey_progress[currentSurveyProgress['index']] = newSurveyProgress;
      }

      // _this.survey_progress = surveyProgress;

      _this.markModified('survey_progress');

      _this.save(function (err, doc) {
        if (!err) {
          console.log('Survey Progress updated for Manager ', _this.employee_id);
        }
      });
    });
  };

  userSchema.statics.registerUser = function registerUser(user, role) {
    var Growthplan = mongoose.model('Growthplan');
    var password = 'testtest1';

    user.last_name = '';
    user.role = role;
    user.userType = role;
    user.is_original_record = false;
    //  user.email = userEmail;
    //  user.full_legal_name = 'User';
    // user.encrypted_password = helper.encryptPassword(password);

    return user.save(function (err) {
      if (err) {
        console.log('Error in Saving user: ' + err);
        throw err;
      } else {
        Growthplan.setup(user);
        console.log('User Registration successfully ' + user.full_legal_name);
      }
    });
  };

  userSchema.statics.importFromDocs = function importFromDocs(usersJSON, callback) {
    var _this = this;
    var Growthplan = mongoose.model('Growthplan');

    var bulk = this.collection.initializeOrderedBulkOp();

    var filteredChicagoUsers = _.filter(usersJSON, function (user) {
      return (user['location'] == 'Engage')
    });

    var users = _.map(filteredChicagoUsers, function (user) {
      var password = 'testtest1';
      //    var generatedEmail = user['Employee ID'] + '@populo.com';
      var encryptedPassword = helper.encryptPassword(password);
      //var userRole = 'Manager';
      var userRole = (user['User_Type'] == 'Team Member' ? 'Employee' :
                      (user['User_Type'] == 'Leader') ? 'Leader' :
                      (user['User_Type'] == 'Manager') ? 'Manager' :'HR Manager');
      var userType = userRole;
      var ancestors = helper.getAncestors(usersJSON, user);

      return {
        email: user['Email'].toLowerCase(),
        //role: userRole,
        role: userRole,
        ancestors: ancestors,
        userType: userType,
        is_original_record: true,
        location: user['location'],
        job_family: user['Job_Family'],
        manager_id: user['Manager_ID'],
        employee_id: user['Employee_ID'],
        job_profile: user['Job_Profile'],
        encrypted_password: encryptedPassword,
        user_name: user['User_Name'],
        full_legal_name: user['Full_Name'],
        manager_location: user['Manager_Location'],
        job_family_group: user['Job_Family_Group'],
        superior_organization: user['Superior_Organization'],
        supervisory_reference_id: user['Supervisory_ReferenceID'],
        supervisory_organization: user['Supervisory_Organization'],
        manager_full_name: user['Manager_-_Full_Name'],
        manager_full_legal_name: user['Manager_-_Full_Legal_Name']
      };
    });

    _.each(users, function(user){
      bulk.find({email: user.email.toLowerCase()}).upsert().updateOne(user);
    });

    bulk.execute(function (err, docs) {

      _.each(users, function (user) {
        Growthplan.setup(user);
      });

      callback(users);
    });
  };

  userSchema.statics.importFromDocsV2 = function importFromDocs(usersJSON, callback) {
    var _this = this;
    var Growthplan = mongoose.model('Growthplan');

    var bulk = this.collection.initializeOrderedBulkOp();

    var users = _.map(usersJSON, function (user) {
      var password = user['Password'];
      var encryptedPassword = helper.encryptPassword(password);
      var userRole = (user['User_Type'] == 'Team Member' ? 'Employee' :
                      (user['User_Type'] == 'Leader') ? 'Leader' :
                      (user['User_Type'] == 'Manager') ? 'Manager' :'HR Manager');
      var userType = userRole;
      var ancestors = helper.getAncestors(usersJSON, user);

      return {
        email: user['Email'].toLowerCase(),
        role: userRole,
        ancestors: ancestors,
        userType: userType,
        is_original_record: true,
        location: user['Location'],
        job_family: user['Job_Family'],
        manager_id: user['Manager_ID'],
        employee_id: user['Employee_ID'],
        job_profile: user['Job_Profile'],
        encrypted_password: encryptedPassword,
        user_name: user['User_Name'],
        full_legal_name: user['Full_Name'],
        manager_full_name: user['Manager_Full_Name'],
        manager_full_legal_name: user['Manager_Full_Name']
      };
    });

    _.each(users, function(user){
      bulk.find({email: user.email.toLowerCase()}).upsert().updateOne(user);
    });

    bulk.execute(function (err, docs) {

      _.each(users, function (user) {
        Growthplan.setup(user);
      });

      callback(users);
    });
  };

  userSchema.methods.assignedEmployees = function assignedEmployees() {
    var manager = this;
    var User = mongoose.model('User');

    var promise = User.find({employee_id: {$in: manager.ancestors}}).then(function (employees) {
      return employees;
    });

    return promise;
  };

  userSchema.methods.generateReport = function generateReport(requestedUrl) {
    var _this = this;
    var fs = require('fs');

    try {
      var conversion = require("phantom-html-to-pdf")();

      var address = requestedUrl + "/generate-report/" + _this._id;
      var output = './public/pdf/' + _this.full_legal_name + ' Growth Report.pdf'
      var fileNew = fs.createWriteStream(output);

      console.log('file saved in ' + fileNew);

      conversion({
        url: address,
        viewportSize: {
          width: 970,
          height: 1050
        },
        zoomFactor: 1.30,
        paperSize: {
          format: 'A4',
          orientation: 'portrait',
          border: '1cm'
        },
        format: {
          quality: 100
        },
        printDelay: 1000,
        settings: {
          javascriptEnabled: true
        }
      }, function (err, pdf) {
        console.log('pdf stream out to file');
        pdf.stream.pipe(fileNew);
      });
    } catch (e) {
      console.log(e);
    }
  };

  userSchema.methods.latestSkillSubmissions = function latestSkillSubmissions() {
    var _this = this;
    var Submission = mongoose.model('Submission');

    Submission.findOne({user: _this._id, tag: 'SKILLS'}).sort({created_at: -1}).exec(function (err, submission) {
      var skillAssessmentQA = '';

      if (submission) {
        skillAssessmentQA = submission.questionAnswersAggr;
      } else {
        var questions = [0];
        var answers = [0];

        skillAssessmentQA = {questions: questions, answers: answers}
      }

      return skillAssessmentQA;
    });
  };

  return mongoose.model('User', userSchema);
};

