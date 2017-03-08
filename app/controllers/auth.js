var express = require('express'),
    _ = require('underscore'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    helper = require('../../config/helper.js'),
    User = mongoose.model('User'),
    Notification = mongoose.model('Notification'),
    Assessment = mongoose.model('Assessment'),
    Submission = mongoose.model('Submission'),
    SubmissionRaters = mongoose.model('SubmissionRaters'),
    Survey = mongoose.model('Survey'),
    ftpClient = require('ftp-client'),
    formidable = require('formidable'),
    archiver = require('archiver');

module.exports = function (app, config) {

  if(config.saml.enabled){
    app.get('/',
      function (req, res) {
        if (req.isAuthenticated()) {
          return res.redirect('/dashboard')
        } else {
          return res.redirect('/signedOut')
        }
      });
    
    app.post(config.saml.path, passport.authenticate('saml', {
      failureRedirect: '/',
      failureFlash: true
    }), function(req, res) {
      return res.redirect('/dashboard');
    });
    
    app.get(
      '/login',
      passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
      function(req, res) {
        return res.redirect('/dashboard');
      }
    );

    app.get('/logout', function (req, res) {
      req.logout();    
      return res.redirect('/signedOut');
    });

    app.get('/signedOut', function(req, res){
      return res.render('signedOut');
    });
  }
  else{

    app.get('/',
      function (req, res) {
        if (req.isAuthenticated()) {
          res.redirect('/dashboard')
        } else { 
          res.render('login', {title: 'message'});
        }
      });
    
    app.post('/login', passport.authenticate('login', {
      successRedirect: '/dashboard',
      failureRedirect: '/',
      failureFlash: true
    }));

    app.get('/splash', function (req, res) {
      if (req.isAuthenticated()) {
        var response = {
            user: req.user,
            lms_link: 'http://area51.learniphi.com/',
            assessment_link: '/dashboard'
        }
        res.render('splash', response);
      } else {
        res.redirect('/');
      }      
    });

    app.get('/logout', function (req, res) {
      req.logout();
      res.redirect('/');
    });    
  }  
  
  app.get('/dashboard', helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        Submission.find({user: user._id}, function (err, submissions) {

          var skillAssessmentQA = '';
          var culctureQA = '';
          var managerEffectivenessQA = '';
          var selfEffectivenessQA = '';
          var teamEffectivenessQA = '';
          var behaviorsQA = '';
          var isSkillEmpty = false;
          var isculctureEmpty = false;
          var isManagerEffectivenessEmpty = false;
          var isSelfEffectivenessEmpty = false;
          var isTeamEffectivenessEmpty = false;
          var isBehaviorsEmpty = false;

          _.each(submissions, function (submission) {
            if (submission.tag == 'SKILLS') {
              skillAssessmentQA = submission.getQuestionsAndAnswers();
            } else if (submission.tag == 'culcture') {
              culctureQA = submission.getQuestionsAndAnswers();
            } else if (submission.tag == 'MANAGER EFFECTIVENESS') {
              managerEffectivenessQA = submission.getQuestionsAndAnswers();
            }else if (submission.tag == 'SELF EFFECTIVENESS') {
              selfEffectivenessQA = submission.getQuestionsAndAnswers();
            } else if (submission.tag == 'TEAM EFFECTIVENESS') {
              teamEffectivenessQA = submission.getQuestionsAndAnswers();
            } else if (submission.tag == 'BEHAVIORS') {
              behaviorsQA = submission.getQuestionsAndAnswers();
            }
          });

          // Multi-Raters Data for Chart
          var multiRatersBehaviours = [];
          var multiRatersSkills = [];
          var employeeManagerRatingBehaviours = [];
          var employeeManagerRatingSkills = [];
          var employeeTeamRatingBehaviours = [];
          var employeeTeamRatingSkills = [];
          var employeeTeamEffectiveness = [];
          
          SubmissionRaters.find({userRater: user._id}).populate('user assessment').then(function (submissionRaters) {
            _.each(submissionRaters, function (submissionRater) {
                if (submissionRater.tag == 'SKILLS') {
                    if(user.manager_id == submissionRater.user.employee_id) 
                        employeeManagerRatingSkills.push(submissionRater.getQuestionsAndAnswers());
                    else if(user.manager_id == submissionRater.user.manager_id)
                        employeeTeamRatingSkills.push(submissionRater.getQuestionsAndAnswers());
                } else if (submissionRater.tag == 'BEHAVIORS') {
                    if(user.manager_id == submissionRater.user.employee_id) 
                        employeeManagerRatingBehaviours.push(submissionRater.getQuestionsAndAnswers());
                    else if(user.manager_id == submissionRater.user.manager_id)
                        employeeTeamRatingBehaviours.push(submissionRater.getQuestionsAndAnswers());
                    else
                        multiRatersBehaviours.push(submissionRater.getQuestionsAndAnswers());
                }
            });
          });
          
          Submission.find({tag: 'TEAM EFFECTIVENESS', user: {$ne: user._id}}).populate({path: 'user', match: {manager_id: user.manager_id}}).exec(function (err, submissions1) {
              _.each(submissions1, function (submission1) {
                  employeeTeamEffectiveness.push(submission1.getQuestionsAndAnswers());
              });
          });

          Notification.find({notifierId: user._id, read: false, todoNotification: true}, function (err, notifications) {
            Survey.findOne({"assignees._id": user._id}, function (err, survey) {

              if(survey){
                _.each(survey.getAssessments(user), function (assessment) {
                  var questions = _.pluck(assessment.questions, 'title');
                  var answers = new Array(questions.length).fill(0);

                  if (skillAssessmentQA == '' && assessment.tag == 'SKILLS') {
                    isSkillEmpty = true;
                    skillAssessmentQA = {questions: questions, answers: answers}
                  } else if (culctureQA == '' && assessment.tag == 'culcture') {
                    isculctureEmpty = true;
                    culctureQA = {questions: questions, answers: answers}
                  } else if (managerEffectivenessQA == '' && assessment.tag == 'MANAGER EFFECTIVENESS') {
                    isManagerEffectivenessEmpty = true;
                    managerEffectivenessQA = {questions: questions, answers: answers}
                  } else if (selfEffectivenessQA == '' && assessment.tag == 'SELF EFFECTIVENESS') {
                    isSelfEffectivenessEmpty = true;
                    selfEffectivenessQA = {questions: questions, answers: answers}
                  } else if (teamEffectivenessQA == '' && assessment.tag == 'TEAM EFFECTIVENESS') {
                    isTeamEffectivenessEmpty = true;
                    teamEffectivenessQA = {questions: questions, answers: answers}
                  } else if (behaviorsQA == '' && assessment.tag == 'BEHAVIORS') {
                    isBehaviorsEmpty = true;
                    behaviorsQA = {questions: questions, answers: answers}
                  }
                });
              }

              // var submittedNotification = _.find(notifications, function (notification) {
              //   return (notification.type.notificationType == 'SurveySubmission')
              // });

              var submittedNotification = survey && survey.isExpiry() ? true : false;

              var response = {
                message: req.flash('successfully logged in'), user: user, isSkillEmpty: isSkillEmpty,
                isculctureEmpty: isculctureEmpty, culctureQA: JSON.stringify(culctureQA),
                skillsQA: JSON.stringify(skillAssessmentQA), notifications: notifications.reverse(),
                isManagerEffectivenessEmpty: isManagerEffectivenessEmpty,
                managerEffectivenessQA: JSON.stringify(managerEffectivenessQA),
                isSelfEffectivenessEmpty: isSelfEffectivenessEmpty,
                selfEffectivenessQA: JSON.stringify(selfEffectivenessQA),
                isTeamEffectivenessEmpty: isTeamEffectivenessEmpty,
                teamEffectivenessQA: JSON.stringify(teamEffectivenessQA),
                isBehaviorsEmpty: isBehaviorsEmpty,
                behaviorsQA: JSON.stringify(behaviorsQA),
                userName: user.full_legal_name, survey: survey, submittedNotification: submittedNotification,
                multiRatersBehaviours: JSON.stringify(multiRatersBehaviours), multiRatersSkills: JSON.stringify(multiRatersSkills),
                employeeManagerRatingBehaviours: JSON.stringify(employeeManagerRatingBehaviours), employeeManagerRatingSkills: JSON.stringify(employeeManagerRatingSkills),
                employeeTeamRatingBehaviours: JSON.stringify(employeeTeamRatingBehaviours), employeeTeamRatingSkills: JSON.stringify(employeeTeamRatingSkills),
                employeeTeamEffectiveness: JSON.stringify(employeeTeamEffectiveness)
              };

              res.render('employee/dashboard', response);
            })
          })
        });
      });

  app.get('/manager-insights', helper.isLoggedIn,
      function (req, res) {
        var user = req.user;

        Notification.find({notifierId: user._id, read: false, todoNotification: true}, function (err, notifications) {
          Survey.find({}, function (err, surveys) {
            User.findOne({employee_id: user.employee_id},
                function (err, manager) {

                  User.find({ancestors: manager.employee_id}, function (err, employees) {
                    employees = _.sortBy(employees, 'full_legal_name');

                    var employeeStats = _.map(surveys, function(survey){
                      return {surveyId: survey._id, stats: survey.getManagerStats(user, employees)};
                    });

                    var response = {
                      message: req.flash('successfully loggedin'), user: user, employees: employees,
                      notifications: notifications.reverse(), userName: user.full_legal_name, surveys: surveys,
                      assessmentTags: constants.human_tag_names, employeeStats: employeeStats,
                      ManagerAssessmentTags: constants.manager_tag_names_dropdown
                    };

                    if (user.role == 'Manager') {
                      res.render('manager/dashboard', response);
                    } else {
                      res.redirect('/');
                    }
                  });
                });
          })
        })
      });

  app.get('/teamleader-insights', helper.isLoggedIn,
      function (req, res) {
        var user = req.user;

        Notification.find({notifierId: user._id, read: false, todoNotification: true}, function (err, notifications) {
          Survey.find({}, function (err, surveys) {
            User.findOne({employee_id: user.employee_id},
                function (err, teamleader) {

                  User.find({ancestors: teamleader.employee_id}, function (err, employees) {
                    employees = _.sortBy(employees, 'full_legal_name');

                    var employeeStats = _.map(surveys, function(survey){
                      return {surveyId: survey._id};
                    });

                    var response = {
                      message: req.flash('successfully loggedin'), user: user, employees: employees,
                      notifications: notifications.reverse(), userName: user.full_legal_name, surveys: surveys,
                      assessmentTags: constants.human_tag_names, employeeStats: employeeStats
                    };

                    if (user.role == 'Leader') {
                      res.render('team-leader/dashboard', response);
                    } else {
                      res.redirect('/');
                    }
                  });
                });
          })
        })
      });


  app.get('/hr-insights', helper.isLoggedIn,
      function (req, res) {
        var user = req.user;

        //Submission.find({user: user._id}).populate('assessment').then(function (submissions) {
        //
        //  var skillAssessmentQA = '';
        //  var culctureQA = '';
        //  var managerEffectivenessQA = '';
        //  var selfEffectivenessQA = '';
        //  var teamEffectivenessQA = '';
        //  var behaviorsQA = '';
        //  var isSkillEmpty = false;
        //  var isculctureEmpty = false;
        //  var isManagerEffectivenessEmpty = false;
        //  var isSelfEffectivenessEmpty = false;
        //  var isTeamEffectivenessEmpty = false;
        //  var isBehaviorsEmpty = false;
        //
        //  _.each(submissions, function (submission) {
        //    if (submission.tag == 'SKILLS') {
        //      skillAssessmentQA = submission.getQuestionsAndAnswers();
        //    } else if (submission.tag == 'culcture') {
        //      culctureQA = submission.getQuestionsAndAnswers();
        //    } else if (submission.tag == 'MANAGER EFFECTIVENESS') {
        //      managerEffectivenessQA = submission.getQuestionsAndAnswers();
        //    } else if (submission.tag == 'SELF EFFECTIVENESS') {
        //      selfEffectivenessQA = submission.getQuestionsAndAnswers();
        //    } else if (submission.tag == 'TEAM EFFECTIVENESS') {
        //      teamEffectivenessQA = submission.getQuestionsAndAnswers();
        //    } else if (submission.tag == 'BEHAVIORS') {
        //      behaviorsQA = submission.getQuestionsAndAnswers();
        //    }
        //  });
        //

          Notification.find({notifierId: user._id, read: false, todoNotification: true}, function (err, notifications) {
            Survey.find({}, function (err, surveys) {
              User.aggregate([{
                $group: {
                  _id: "$manager_full_legal_name",
                  employees: {"$addToSet": "$full_legal_name"}
                }
              }], function (err, managerEmployees) {
                var managers = _.sortBy(managerEmployees, '_id');
//
//              var managerEmployees = _.map(managers, function (manager) {
//                var employees = _.filter(users, function (user) {
//                  return (manager.employee_id == user.manager_id);
//                });
//
//                employees = _.sortBy(employees, 'full_legal_name');
//                return {manager: manager, employees: employees}
//              });

                //Survey.findOne({"raters.email": user.email}).then(function (survey) {
                //  _.each(survey.getAssessments(user), function (assessment) {
                //    var questions = _.pluck(assessment.questions, 'title');
                //    var answers = new Array(questions.length).fill(0);
                //
                //    if (skillAssessmentQA == '' && assessment.tag == 'SKILLS') {
                //      isSkillEmpty = true;
                //      skillAssessmentQA = {questions: questions, answers: answers}
                //    } else if (culctureQA == '' && assessment.tag == 'culcture') {
                //      isculctureEmpty = true;
                //      culctureQA = {questions: questions, answers: answers}
                //    } else if (managerEffectivenessQA == '' && assessment.tag == 'MANAGER EFFECTIVENESS') {
                //      isManagerEffectivenessEmpty = true;
                //      managerEffectivenessQA = {questions: questions, answers: answers}
                //    } else if (selfEffectivenessQA == '' && assessment.tag == 'SELF EFFECTIVENESS') {
                //      isSelfEffectivenessEmpty = true;
                //      selfEffectivenessQA = {questions: questions, answers: answers}
                //    } else if (teamEffectivenessQA == '' && assessment.tag == 'TEAM EFFECTIVENESS') {
                //      isTeamEffectivenessEmpty = true;
                //      teamEffectivenessQA = {questions: questions, answers: answers}
                //    } else if (behaviorsQA == '' && assessment.tag == 'BEHAVIORS') {
                //      isBehaviorsEmpty = true;
                //      behaviorsQA = {questions: questions, answers: answers}
                //    }
                //  });


                  var response = {
                    message: req.flash('successfully loggedin'), user: user, managerEmployees: managers,
                    //isculctureEmpty: isculctureEmpty,isSkillEmpty: isSkillEmpty,
                    notifications: notifications.reverse(), userName: user.full_legal_name, surveys: surveys,
                    assessmentTags: constants.human_tag_names
                  };

                  if (user.role == 'HR Manager') {
                    res.render('hr-manager/dashboard', response);
                  } else {
                    res.redirect('/');
                  }
                })
              })
            });
          //})
        //});
      });

  app.get('/reports',helper.isLoggedIn,
      function(req, res){
        var output = fs.createWriteStream('tmp/reports.zip');
        var zipArchive = archiver('zip');

        output.on('close', function() {
          console.log('done with the zip');
          res.download('tmp/reports.zip');
        });

        zipArchive.pipe(output);

        zipArchive.bulk([
          { src: [ '**/*' ], cwd: 'public/pdf', expand: true }
        ]);

        zipArchive.finalize(function(err, bytes) {
          if(err) {
            throw err;
          }
          console.log('done:', base, bytes);
        });
      });

  app.post('/upload', function (req, res) {

    var ftp = req.body.ftp;
    var portNo = req.body.portNo || 21;
    var userName = req.body.userName;
    var password = req.body.password;

    var ftpConfig = {
      host: ftp,
      port: portNo,
      user: userName,
      password: password
    };

    var options = {
      logging: 'basic'
    };

    if(_.isEmpty(portNo) && _.isEmpty(userName) && _.isEmpty(password)){
      res.status(402).json({status: 'failure', msg: ''});
    }else{

      var client = new ftpClient(ftpConfig, options);

    client.connect(function () {
      client.upload(['public/pdf/**'], '/team_reports/', {
        baseDir: 'public',
        //uploadedFiles: files['report-files'],
        overwrite: 'older'
      }, function (result) {
        if (_.isEmpty(result.errors)) {
          res.status(200).json({status: 'success', msg: result});
        } else {
          res.status(402).json({status: 'failure', msg: result});
        }
      });
    });
  }
});
};
