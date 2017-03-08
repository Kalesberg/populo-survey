var express = require('express'),
    mongoose = require('mongoose'),
    jade = require('jade'),
    User = mongoose.model('User'),
    Template = mongoose.model('Template'),
    Survey = mongoose.model('Survey'),
    Growthplan = mongoose.model('Growthplan'),
    GrowthplanItem = mongoose.model('GrowthplanItem'),
    _ = require('underscore'),
    xlsx = require('xlsx'),
    formidable = require('formidable'),
    fs = require('fs'),
    helper = require('../../config/helper.js');

module.exports = function (app, config) {

  app.get('/templates/:id/questions',
      helper.isLoggedIn,
      function(req, res){
        var templateId = req.params.id;
        Template.find({_id: templateId}).populate('question_bank').then(function(template){
          User.find({$or: [{role: 'Manager'}, {role: 'Leader'}]}, function (err, users) {
            users = _.sortBy(users, 'full_legal_name');
            res.status(200).json({template: template, users: users})
          });
        });
      });

  app.post('/xlsx/users',
//      helper.isLoggedIn,
//      helper.isAPIAuthenticated,
      function (req, res) {
        var fileName = 'userExcel';
        var form = new formidable.IncomingForm();

        form.parse(req, function (err, fields, files) {
          var filePath = files[fileName].path;
          var usersJSON = helper.excelImportJSON(xlsx, filePath);

          console.log(usersJSON);

//          var existedUsers = [];
//          var newUsers = [];
//
//          User.find({}, function(err, users){
//
//            _.each(usersJSON, function(userJSON){
//              if(_.includes(users, userJSON['Email'])){
//                existedUsers.push(userJSON);
//              }else{
//                newUsers.push(userJSON);
//              }
//            });
//
//            function newUsers(users){
//
//            }
//
//            function createUsers(users, callback){
//              User.importFromDocs(newUsers, function (users) {
//
//                var html = jade.renderFile('./app/views/admin/_users.jade',
//                    {users: users});
//
//                res.json({status: 'successfully processed', users_html: html});
//              });
//            }
//
//            createUsers
//
//          });

//          User.remove({is_original_record: true}, function () {

//          });

            User.importFromDocsV2(usersJSON, function (users) {

                var html = jade.renderFile('./app/views/admin/_users.jade',
                    {users: users});

                res.json({status: 'successfully processed', users_html: html});
              });
        });
      });

  app.get('/filespath',
      helper.isAPIAuthenticated,
      function (req, res) {
        var array = [];

        fs.readdir('public/pdf', function (err, files) {
          if (err) return;
          files.forEach(function (f) {
            array.push(req.hostname + '/files/pdf/' + f);
          });

          res.json(array);
        });
      }
  );

  app.get('/admin',
      helper.isLoggedIn,
      function (req, res) {
        Template.find({}, function(err, templates){
          if (req.user.role == 'HR Manager') {
              Survey.find({archive: false}, function (err, surveys) {
                User.find({}, function (err, users) {
                  users = _.sortBy(users, 'full_legal_name');
                  res.render('admin/administration', {
                    users: users, templates: templates,
                    surveysJSON: JSON.stringify(surveys),
                    surveys: surveys,
                    user: req.user
                  });
                });
              });
          }
          else {
              Survey.find({archive: false, assignManager: {$elemMatch:{$eq:req.user._id.toString()}}, isSharedWithManager: true}, function (err, surveys) {
                User.find({}, function (err, users) {
                  users = _.sortBy(users, 'full_legal_name');
                  res.render('admin/administration', {
                    users: users, templates: templates,
                    surveysJSON: JSON.stringify(surveys),
                    surveys: surveys,
                    user: req.user
                  });
                });
              });
          }
        });
      }
  );

  app.post('/surveyDeploy',
      helper.isLoggedIn,
      function (req, res) {
        var surveyId = req.body.surveyId;
        var assignedUsers = req.body.assignedUsers;

          var assignedUsersList = assignedUsers.split(',');

          Survey.findOne({_id: surveyId}, function (err, survey) {
            var existingSurveyUsersId = _.map(survey.assignees, function(user){
              return user._id.toString();
            });

            var newUserIds = _.filter(assignedUsersList, function(user){
              return !(_.includes(existingSurveyUsersId, user.toString()));
            });

            User.find({_id: {$in: assignedUsersList}}, function (err, users) {
              survey.assignees = users;
              survey.state = 'started';
              survey.markModified('assignees');
              survey.save(function(err, doc){
                if(err){
                  res.status(402).json({status: 'failure'})
                }
                console.log('Survey Successfully Updated');
                
                var hostname = req.headers.host;
                var protocol = 'http';
                for(i=0; i < users.length; i++) {
                    if(_.includes(newUserIds, users[i]._id.toString())) {
                        var expiry_date = survey.expiry_date_format();
                        var survey_link = protocol + '://' + hostname + '/assessments/' + survey._id;
                        var html = jade.renderFile('./app/views/employee/survey_launch_email.jade',
                        {user_name: users[i].full_legal_name, expiry_date: expiry_date, survey_link: survey_link});

                        var mailOptions = {
                          from: config.SMTPUsername,
                          to: users[i].email,
                          subject: 'populo Growth – Take the survey now',
                          text: html,
                          html: html
                        };

                        app.smtpTransport.sendMail(mailOptions, function (error, info) {
                          if (error) {
                            return console.log(error);
                          }

                          console.log('Message sent: ' + info.response);
                          //res.redirect('/growth-plan');
                        });
                    }
                }
                
                res.status(200).json({status: 'success'})
              });
            });

            //Notifications to new users
            User.find({_id: {$in: newUserIds}}, function(err, users){
              survey.regenerateUserStats();
              survey.sendNotifications(users);
            });
          })
      });

    app.get('/generateCompleteGrowthReport', 
        function (req, res) {
            var User = mongoose.model('User');
            var requestedUrl = req.protocol + '://' + req.get('host');
            
            User.find({}, function (err, users) {
                _.each(users, function (user) {
                    user.generateReport(requestedUrl);
                });
            });
            
            res.status(200).json({status: 'success'});
        }
    );
  
  app.get('/generate-report/:userId',
//      helper.isLoggedIn,
        function (req, res) {
            var userId = req.params.userId;
            var Submission = mongoose.model('Submission');
            var SubmissionRaters = mongoose.model('SubmissionRaters');
            var User = mongoose.model('User');

            var skillsQA = '';
            var culctureQA = '';
            var managerEffectivenessQA = '';
            var teamEffectivenessQA = '';
            var behaviorsQA = '';


            User.findOne({_id: userId}, function (err, user) {
              if(user.role == 'Manager' || user.role == 'HR Manager') {
                  console.log('Manager report');
                  Submission.find({user: user._id}, function (err, submissions) {
                    if (submissions) {
                      var culcture = _.find(submissions, function (submission) {
                        culctureQA = submission.getQuestionsAndAnswers();
                        return (submission.tag == 'culcture')
                      });
                      var team_effectiveness = _.find(submissions, function (submission) {
                        teamEffectivenessQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'TEAM EFFECTIVENESS'
                      });
                      var manager_effectiveness = _.find(submissions, function (submission) {
                        managerEffectivenessQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'MANAGER EFFECTIVENESS'
                      });
                      var behaviors = _.find(submissions, function (submission) {
                        behaviorsQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'BEHAVIORS'
                      });
                      var skills = _.find(submissions, function (submission) {
                        skillsQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'SKILLS'
                      });

                      // Multi-Raters Data for Chart
                      var multiRatersBehaviours = [];
                      var multiRatersSkills = [];
                      var employeeManagerRatingBehaviours = [];
                      var employeeManagerRatingSkills = [];
                      var employeeTeamRatingBehaviours = [];
                      var employeeTeamRatingSkills = [];
                      var employeeTeamEffectiveness = [];
                      var employeeculcture = [];
                      var employeeManagerEffectiveness = [];
                      var employeeBehaviour = [];
                      var employeeMultiratersBehaviour = [];
                      
                      SubmissionRaters.find({userRater: user._id}).populate('user assessment').then(function (submissionRaters) {
                        _.each(submissionRaters, function (submissionRater) {
                            if (submissionRater.tag == 'SKILLS') {
                                if(user.manager_id == submissionRater.user.manager_id)
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
                        
                        Submission.find({user: {$ne: user._id}}).populate({path: 'user', match: {manager_id: user.employee_id}}).exec(function (err, submissions1) {
                            _.each(submissions1, function (submission1) {
                                if (submission1.tag == 'culcture') {
                                    employeeculcture.push(submission1.getQuestionsAndAnswers());
                                } else if (submission1.tag == 'TEAM EFFECTIVENESS') {
                                    employeeTeamEffectiveness.push(submission1.getQuestionsAndAnswers());
                                } else if (submission1.tag == 'MANAGER EFFECTIVENESS') {
                                    employeeManagerEffectiveness.push(submission1.getQuestionsAndAnswers());
                                } else if (submission1.tag == 'BEHAVIORS') {
                                    employeeBehaviour.push(submission1.getQuestionsAndAnswers());
                                }
                            });
                            
                            var requestedUrl = req.protocol + '://' + req.get('host');
                            res.render('pdf-templates/reports_manager', {
                              user: user,
                              submission: submissions,
                              culcture: culcture,
                              requestedUrl: requestedUrl,
                              team_effectiveness: team_effectiveness,
                              manager_effectiveness: manager_effectiveness,
                              behaviors: behaviors,
                              skills: skills,
                              culctureQA: JSON.stringify(culctureQA),
                              teamEffectivenessQA: JSON.stringify(teamEffectivenessQA),
                              managerEffectivenessQA: JSON.stringify(managerEffectivenessQA),
                              behaviorsQA: JSON.stringify(behaviorsQA),
                              skillsQA: JSON.stringify(skillsQA),
                              multiRatersBehaviours: JSON.stringify(multiRatersBehaviours), 
                              multiRatersSkills: JSON.stringify(multiRatersSkills),
                              employeeManagerRatingBehaviours: JSON.stringify(employeeManagerRatingBehaviours), 
                              employeeManagerRatingSkills: JSON.stringify(employeeManagerRatingSkills),
                              employeeTeamRatingBehaviours: JSON.stringify(employeeTeamRatingBehaviours), 
                              employeeTeamRatingSkills: JSON.stringify(employeeTeamRatingSkills),
                              employeeTeamEffectiveness: JSON.stringify(employeeTeamEffectiveness),
                              employeeculcture: JSON.stringify(employeeculcture),
                              employeeManagerEffectiveness: JSON.stringify(employeeManagerEffectiveness),
                              employeeBehaviour: JSON.stringify(employeeBehaviour),
                              employeeMultiratersBehaviour: JSON.stringify(employeeMultiratersBehaviour)
                            });
                        });
                      });
                    }
                  });
              } 
              else if(user.role == 'Leader') {
                  console.log('Leader report');
                  Submission.find({user: user._id}, function (err, submissions) {
                    if (submissions) {
                      var culcture = _.find(submissions, function (submission) {
                        culctureQA = submission.getQuestionsAndAnswers();
                        return (submission.tag == 'culcture')
                      });
                      var team_effectiveness = _.find(submissions, function (submission) {
                        teamEffectivenessQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'TEAM EFFECTIVENESS'
                      });
                      var manager_effectiveness = _.find(submissions, function (submission) {
                        managerEffectivenessQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'MANAGER EFFECTIVENESS'
                      });
                      var behaviors = _.find(submissions, function (submission) {
                        behaviorsQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'BEHAVIORS'
                      });
                      var skills = _.find(submissions, function (submission) {
                        skillsQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'SKILLS'
                      });

                      // Multi-Raters Data for Chart
                      var multiRatersBehaviours = [];
                      var multiRatersSkills = [];
                      var employeeManagerRatingBehaviours = [];
                      var employeeManagerRatingSkills = [];
                      var employeeTeamRatingBehaviours = [];
                      var employeeTeamRatingSkills = [];
                      var myTeamManagerEffectiveness = [];
                      
                      var employeeTeamEffectiveness = {};
                      var employeeculcture = {};
                      var employeeManagerEffectiveness = {};
                      var employeeBehaviour = {};
                      var employeeSkills = {};
                      var employeeMultiratersBehaviour = [];
                      
                      var managerTeamEffectiveness = {};
                      var managerBehaviour = {};
                      var managerList = [];
                      var managerNameList = [];
                      
                      SubmissionRaters.find({userRater: user._id, tag: "BEHAVIORS"}).populate('user assessment').then(function (submissionRaters) {
                        _.each(submissionRaters, function (submissionRater) {
                            if(user.manager_id == submissionRater.user.employee_id) 
                                employeeManagerRatingBehaviours.push(submissionRater.getQuestionsAndAnswers());
                            else if(user.manager_id == submissionRater.user.manager_id)
                                employeeTeamRatingBehaviours.push(submissionRater.getQuestionsAndAnswers());
                            else
                                multiRatersBehaviours.push(submissionRater.getQuestionsAndAnswers());
                        });
                        
                        employeeManagerRatingBehaviours = [];
                        employeeTeamRatingBehaviours = [];
                        
                        /*Submission.find({user: {$ne: user._id}, tag: 'MANAGER EFFECTIVENESS'}).populate('user').exec(function (err, submissions1) {
                            _.each(submissions1, function (submission1) {
                                if (submission1.user.manager_id == user.employee_id)
                                    myTeamManagerEffectiveness.push(submission1.getQuestionsAndAnswers());
                            });
                        });*/
                        
                        User.find({manager_id: user.employee_id, $or: [{role: "Manager"}, {role: "HR Manager"}]}, function (err, user_team_managers) {
                            _.each(user_team_managers, function (user_team_manager) {
                                managerList.push(user_team_manager.employee_id);
                                managerNameList.push(user_team_manager.full_legal_name);
                                employeeculcture[user_team_manager.employee_id] = [];
                                employeeTeamEffectiveness[user_team_manager.employee_id] = [];
                                employeeManagerEffectiveness[user_team_manager.employee_id] = [];
                                employeeBehaviour[user_team_manager.employee_id] = [];
                                employeeSkills[user_team_manager.employee_id] = [];
                                managerTeamEffectiveness[user_team_manager.employee_id] = [];
                                managerBehaviour[user_team_manager.employee_id] = [];
                            });
                            
                            Submission.find({}).populate('user').exec(function (err, submissions1) {
                                _.each(submissions1, function (submission1) {
                                    if (submission1.tag == 'culcture') {
                                        if (employeeculcture[submission1.user.manager_id])
                                            employeeculcture[submission1.user.manager_id].push(submission1.getQuestionsAndAnswers());
                                    } else if (submission1.tag == 'TEAM EFFECTIVENESS') {
                                        if (employeeTeamEffectiveness[submission1.user.manager_id]) 
                                            employeeTeamEffectiveness[submission1.user.manager_id].push(submission1.getQuestionsAndAnswers());
                                        if (managerTeamEffectiveness[submission1.user.employee_id])
                                            managerTeamEffectiveness[submission1.user.employee_id].push(submission1.getQuestionsAndAnswers());
                                    } else if (submission1.tag == 'MANAGER EFFECTIVENESS') {
                                        if (employeeManagerEffectiveness[submission1.user.manager_id])
                                            employeeManagerEffectiveness[submission1.user.manager_id].push(submission1.getQuestionsAndAnswers());
                                        if (submission1.user.manager_id == user.employee_id)
                                            myTeamManagerEffectiveness.push(submission1.getQuestionsAndAnswers());
                                    } else if (submission1.tag == 'BEHAVIORS') {
                                        if (employeeBehaviour[submission1.user.manager_id])
                                            employeeBehaviour[submission1.user.manager_id].push(submission1.getQuestionsAndAnswers());
                                        if (managerBehaviour[submission1.user.employee_id])
                                            managerBehaviour[submission1.user.employee_id].push(submission1.getQuestionsAndAnswers());
                                    } else if (submission1.tag == 'SKILLS') {
                                        if (employeeSkills[submission1.user.manager_id])
                                            employeeSkills[submission1.user.manager_id].push(submission1.getQuestionsAndAnswers());
                                    } 
                                });
                                
                                var requestedUrl = req.protocol + '://' + req.get('host');
                                console.log("return to renderer");
                                console.log((employeeculcture));
                                res.render('pdf-templates/reports_leader', {
                                    user: user,
                                    submission: submissions,
                                    culcture: culcture,
                                    requestedUrl: requestedUrl,
                                    team_effectiveness: team_effectiveness,
                                    manager_effectiveness: manager_effectiveness,
                                    behaviors: behaviors,
                                    skills: skills,
                                    culctureQA: JSON.stringify(culctureQA),
                                    teamEffectivenessQA: JSON.stringify(teamEffectivenessQA),
                                    managerEffectivenessQA: JSON.stringify(managerEffectivenessQA),
                                    behaviorsQA: JSON.stringify(behaviorsQA),
                                    skillsQA: JSON.stringify(skillsQA),
                                    multiRatersBehaviours: JSON.stringify(multiRatersBehaviours), 
                                    multiRatersSkills: JSON.stringify(multiRatersSkills),
                                    employeeManagerRatingBehaviours: JSON.stringify(employeeManagerRatingBehaviours), 
                                    employeeManagerRatingSkills: JSON.stringify(employeeManagerRatingSkills),
                                    employeeTeamRatingBehaviours: JSON.stringify(employeeTeamRatingBehaviours), 
                                    employeeTeamRatingSkills: JSON.stringify(employeeTeamRatingSkills),
                                    myTeamManagerEffectiveness: JSON.stringify(myTeamManagerEffectiveness),
                                    employeeTeamEffectiveness: JSON.stringify(employeeTeamEffectiveness),
                                    employeeculcture: JSON.stringify(employeeculcture),
                                    employeeManagerEffectiveness: JSON.stringify(employeeManagerEffectiveness),
                                    employeeBehaviour: JSON.stringify(employeeBehaviour),
                                    employeeSkills: JSON.stringify(employeeSkills),
                                    employeeMultiratersBehaviour: JSON.stringify(employeeMultiratersBehaviour),
                                    managerTeamEffectiveness: JSON.stringify(managerTeamEffectiveness),
                                    managerBehaviour: JSON.stringify(managerBehaviour),
                                    managerList: JSON.stringify(managerList),
                                    managerNameList: JSON.stringify(managerNameList)
                                });
                            });
                            
                            
                            /*Submission.find({user: {$ne: user_team_manager._id}}).populate('user').exec(function (err, submissions1) {
                                _.each(submissions1, function (submission1) {
                                    if (submission1.user.manager_id == user_team_manager.employee_id) {
                                        if (submission1.tag == 'culcture') {
                                            employeeculcture[user_team_manager.full_legal_name].push(submission1.getQuestionsAndAnswers());
                                        } else if (submission1.tag == 'TEAM EFFECTIVENESS') {
                                            employeeTeamEffectiveness[user_team_manager.full_legal_name].push(submission1.getQuestionsAndAnswers());
                                        } else if (submission1.tag == 'MANAGER EFFECTIVENESS') {
                                            employeeManagerEffectiveness[user_team_manager.full_legal_name].push(submission1.getQuestionsAndAnswers());
                                        } else if (submission1.tag == 'BEHAVIORS') {
                                            employeeBehaviour[user_team_manager.full_legal_name].push(submission1.getQuestionsAndAnswers());
                                        } else if (submission1.tag == 'SKILLS') {
                                            employeeSkills[user_team_manager.full_legal_name].push(submission1.getQuestionsAndAnswers());
                                        }
                                    }
                                });
                                
                                Submission.find({user: user_team_manager._id}).populate('user').exec(function (err, submissions1) {
                                    _.each(submissions1, function (submission1) {
                                        if (submission1.tag == 'TEAM EFFECTIVENESS') {
                                            managerTeamEffectiveness[user_team_manager.full_legal_name].push(submission1.getQuestionsAndAnswers());
                                        } else if (submission1.tag == 'BEHAVIORS') {
                                            managerBehaviour[user_team_manager.full_legal_name].push(submission1.getQuestionsAndAnswers());
                                        }
                                    });
                                    count++;
                                });
                            });*/
                        });
                      });
                    }
                  });
              } else {
                  console.log('Employee report');
                  Submission.find({user: user._id}, function (err, submissions) {
                    if (submissions) {
                      var culcture = _.find(submissions, function (submission) {
                        culctureQA = submission.getQuestionsAndAnswers();
                        return (submission.tag == 'culcture')
                      });
                      var team_effectiveness = _.find(submissions, function (submission) {
                        teamEffectivenessQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'TEAM EFFECTIVENESS'
                      });
                      var manager_effectiveness = _.find(submissions, function (submission) {
                        managerEffectivenessQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'MANAGER EFFECTIVENESS'
                      });
                      var behaviors = _.find(submissions, function (submission) {
                        behaviorsQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'BEHAVIORS'
                      });
                      var skills = _.find(submissions, function (submission) {
                        skillsQA = submission.getQuestionsAndAnswers();
                        return submission.tag == 'SKILLS'
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
                        
                        Submission.find({tag: 'TEAM EFFECTIVENESS', user: {$ne: user._id}}).populate({path: 'user', match: {manager_id: user.manager_id}}).exec(function (err, submissions1) {
                            _.each(submissions1, function (submission1) {
                                employeeTeamEffectiveness.push(submission1.getQuestionsAndAnswers());
                            });
                            
                            var requestedUrl = req.protocol + '://' + req.get('host');
                            res.render('pdf-templates/reports', {
                              user: user,
                              submission: submissions,
                              culcture: culcture,
                              requestedUrl: requestedUrl,
                              team_effectiveness: team_effectiveness,
                              manager_effectiveness: manager_effectiveness,
                              behaviors: behaviors,
                              skills: skills,
                              culctureQA: JSON.stringify(culctureQA),
                              teamEffectivenessQA: JSON.stringify(teamEffectivenessQA),
                              managerEffectivenessQA: JSON.stringify(managerEffectivenessQA),
                              behaviorsQA: JSON.stringify(behaviorsQA),
                              skillsQA: JSON.stringify(skillsQA),
                              multiRatersBehaviours: JSON.stringify(multiRatersBehaviours), 
                              multiRatersSkills: JSON.stringify(multiRatersSkills),
                              employeeManagerRatingBehaviours: JSON.stringify(employeeManagerRatingBehaviours), 
                              employeeManagerRatingSkills: JSON.stringify(employeeManagerRatingSkills),
                              employeeTeamRatingBehaviours: JSON.stringify(employeeTeamRatingBehaviours), 
                              employeeTeamRatingSkills: JSON.stringify(employeeTeamRatingSkills),
                              employeeTeamEffectiveness: JSON.stringify(employeeTeamEffectiveness)
                            });
                        });
                      });
                    }
                  });
              }
            })
        });

  app.get('/growth-plan',
      helper.isLoggedIn,
      function (req, res) {

        res.render('growth-plan/growth-plan');
      });


  app.get('/sample-report',
      helper.isLoggedIn,
      function (req, res) {
        var _this = req.user;
        var Submission = mongoose.model('Submission');
        var User = mongoose.model('User');

        var skillsQA = '';
        var culctureQA = '';
        var managerEffectivenessQA = '';
        var teamEffectivenessQA = '';
        var behaviorsQA = '';


        User.findOne({}, function (err, user) {
          Submission.find({user: _this._id}, function (err, submissions) {
            if (submissions) {
              var culcture = _.find(submissions, function (submission) {
                culctureQA = submission.getQuestionsAndAnswers();
                return (submission.tag == 'culcture')
              });
              var team_effectiveness = _.find(submissions, function (submission) {
                teamEffectivenessQA = submission.getQuestionsAndAnswers();
                return submission.tag == 'TEAM EFFECTIVENESS'
              });
              var manager_effectiveness = _.find(submissions, function (submission) {
                managerEffectivenessQA = submission.getQuestionsAndAnswers();
                return submission.tag == 'MANAGER EFFECTIVENESS'
              });
              var behaviors = _.find(submissions, function (submission) {
                behaviorsQA = submission.getQuestionsAndAnswers();
                return submission.tag == 'BEHAVIORS'
              });
              var skills = _.find(submissions, function (submission) {
                skillsQA = submission.getQuestionsAndAnswers();
                return submission.tag == 'SKILLS'
              });

              res.render('pdf-templates/reports', {
                user: user,
                submission: submissions,
                culcture: culcture,
                team_effectiveness: team_effectiveness,
                manager_effectiveness: manager_effectiveness,
                behaviors: behaviors,
                skills: skills,
                culctureQA: JSON.stringify(culctureQA),
                teamEffectivenessQA: JSON.stringify(teamEffectivenessQA),
                managerEffectivenessQA: JSON.stringify(managerEffectivenessQA),
                behaviorsQA: JSON.stringify(behaviorsQA),
                skillsQA: JSON.stringify(skillsQA)
              });
            }
          });
        })
      });

  app.get('/email-growth-plan',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;

        User.findOne({employee_id: user.manager_id}, function (err, manager) {
          Growthplan.findOne({user_id: user._id}).populate('items').exec(function (err, growthPlan) {

            user.sendGrowthPlanNotfication(growthPlan, manager);

            var html = jade.renderFile('./app/views/employee/growthplan_email.jade',
                {user: user, items: growthPlan.items, manager: manager});

            var mailOptions = {
              subject: 'Growth Plan',
              from: config.SMTPUsername,
              to: manager.email,
              text: html,
              html: html
            };

            app.smtpTransport.sendMail(mailOptions, function (error, info) {
              if (error) {
                return console.log(error);
              }

              console.log('Message sent: ' + info.response);
              //res.redirect('/growth-plan');
            });

          });
          res.status(200).json({status: 'success'});
        })
      });
};
