var express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('lodash'),
    helper = require('../../config/helper.js'),
    Assessment = mongoose.model('Assessment'),
    Survey = mongoose.model('Survey'),
    Template = mongoose.model('Template'),
    Questionbank = mongoose.model('Questionbank'),
    Submission = mongoose.model('Submission'),
    SubmissionRaters = mongoose.model('SubmissionRaters'),
    Question = mongoose.model('Question'),
    Comment = mongoose.model('Comment'),
    Notification = mongoose.model('Notification'),
    Answer = mongoose.model('Answer');

module.exports = function (app, config) {

  app.delete('/survey/archive/:surveyId',
      helper.isLoggedIn,
      function (req, res) {
        var surveyId = req.params.surveyId;

        Survey.findOne({_id: surveyId}, function (err, survey) {
          if (survey) {
            survey.archive = true;
            survey.save(function () {
              console.log('Successfully created archive ', surveyId)
            });
            res.status(200).json({status: 'success'})
          } else {
            res.status(402).json({status: 'failure'})
          }
        })
      });

  app.get('/surveys/:id',
      helper.isLoggedIn,
      function (req, res) {

        var surveyId = req.params.id;

        Survey.findOne({_id: surveyId}).populate({path: 'templateId',
              populate: {path: 'question_bank', model: 'Questionbank'}}
        ).then(function (survey) {
              User.find({}, function (err, users) {
                users = _.sortBy(users, 'full_legal_name');
                User.find({$or: [{role: 'Manager'}, {role: 'Leader'}]}, function (err, managers) {
                  managers = _.sortBy(managers, 'full_legal_name');
                  res.status(200).json({status: 'success', survey: survey, users: users, allManagers: managers})
                });
              });
            })
      });

  app.post('/surveys',
      helper.isLoggedIn,
      function (req, res) {
        var data = req.body;
        var templateId = data.templateId;
        var surveyName = data.surveyName;
        var surveyDate = data.surveyDate;
        var dimensions = data.dimensions.split(',');
        var questions = data.questions.split(',');
        var assignManager = data.assignManager.split(',');
        questions = _.compact(questions); 
        var assessmentsList = [];
        var teamLeaderAssessmentsList = [];
        var ManagerAssessmentsList = [];
        var surveyExpiryDate = _.isEmpty(surveyDate) ? '' : new Date(surveyDate);

        Template.findOne({_id: templateId}).populate('question_bank').exec(function (err, template) {

          Questionbank.findOne({_id: template.question_bank}, function (err, questionbank) {
            var skillQuestions = questionbank.questions;
            var skillSelectedQuestions = [];

            _.each(skillQuestions, function (question) {
              _.each(questions, function (userInput) {
                if (userInput.toString() == question._id.toString()) {
                  skillSelectedQuestions.push(question);
                }
              })
            });
            var newSurvey = new Survey();
            newSurvey.name = surveyName;
            newSurvey.assignees = [];
            newSurvey.expiry_date = surveyExpiryDate;
            newSurvey.state = 'not_started';
            newSurvey.templateId = templateId;
            newSurvey.created_at = new Date();
            newSurvey.updated_at = new Date();
            newSurvey.createdUser = req.user;
            newSurvey.assignManager = assignManager;
            newSurvey = newSurvey.generateEmptyUserStats();

            var availableQuestions = _.map(skillSelectedQuestions, function (question) {
              return question._id.toString();
            });

            var newQuestions = _.difference(questions, availableQuestions);
            var newRegisterQuestions = template.registerQuestions(newQuestions);

            skillSelectedQuestions = _.concat(skillSelectedQuestions, newRegisterQuestions);

            function selectAssessmentRegisterToSurvey(newSurvey, templateAssessments, skillAssessment, role, survey_type) {
              var assessments = [];
              var assessmentsRaters = [];
              var assessmentsTeamMember = [];

              _.each(templateAssessments, function (assessment) {
                if (_.includes(dimensions, assessment.tag)) {
                  assessments.push(assessment);
                  if(role == survey_type && (assessment.tag == 'Behaviors' || assessment.tag == 'Skills')) {
                    assessmentsRaters.push(assessment);
                    assessmentsTeamMember.push(assessment);
                  }
                }
              });
              
              /*if(role != 'leader') {
                assessments.push(skillAssessment);
                assessmentsTeamMember.push(skillAssessment);
              }*/
              
              if(role == survey_type) {
                newSurvey.availableAssessmentForRaters = assessmentsRaters;              
                newSurvey.availableAssessmentForTeamMember = assessmentsTeamMember;              
              }
             
              return newSurvey.addAssessments(assessments, role);
            }

            var skillAssessment = Assessment.generateSkillAssessment(newSurvey, skillSelectedQuestions);

            newSurvey = selectAssessmentRegisterToSurvey(newSurvey, template.assessments, skillAssessment, 'employee', template.survey_type);
            newSurvey = selectAssessmentRegisterToSurvey(newSurvey, template.team_leader_assessments, skillAssessment, 'leader', template.survey_type);
            newSurvey = selectAssessmentRegisterToSurvey(newSurvey, template.manager_assessments, skillAssessment, 'manager', template.survey_type);

            User.find({}, function (err, users) {
              newSurvey.availableRaters = users;
              newSurvey.save(function (err, doc) {
                if (!err) {
                  res.status(200).json({status: 'success', survey: doc})
                } else {
                  res.status(404).json({status: 'failure', survey: doc})
                }
              });
            });
          })

        });
      });

  app.put('/surveys/:id',
      helper.isLoggedIn,
      function (req, res) {
        var surveyId = req.params.id;
        var data = req.body;
        var surveyName = data.surveyName;
        var surveyDate = data.surveyDate;
        var questions = data.questions.split(',');
        var assignManager = data.assignManager.split(',');
        questions = _.compact(questions);
        var dimensions = data.dimensions.split(',');
        var surveyExpiryDate = _.isEmpty(surveyDate) ? '' : new Date(surveyDate);

        Question.find({'_id': {$in: questions}}, function (err, skillquestions) {
          Survey.findOne({_id: surveyId}, function (err, survey) {
            Template.findOne({_id: survey.templateId}, function (err, template) {
              Questionbank.findOne({_id: template.question_bank}, function (err, questionbank) {
                var skillQuestions = questionbank.questions;
                var skillSelectedQuestions = [];

                _.each(skillQuestions, function (question) {
                  _.each(questions, function (userInput) {
                    if (userInput.toString() == question._id.toString()) {
                      skillSelectedQuestions.push(question);
                    }
                  })
                });

                /*function assessmentUpdate(assessments, questions, dimensions) {

                  console.log(questions);
                  var list = assessments;
                  _.each(assessments, function (assessment, index) {
                    if (assessment.tag == 'SKILLS') {
                      assessment.questions = questions;
                      list[index] = assessment;
                    }
                  });
                  return list;
                }
                
                var availableQuestions = _.map(skillSelectedQuestions, function (question) {
                  return question._id.toString();
                });

                var newQuestions = _.difference(questions, availableQuestions);
                var newRegisterQuestions = template.registerQuestions(newQuestions);

                skillSelectedQuestions = _.concat(skillSelectedQuestions, newRegisterQuestions);
                
                var generalAssessments = assessmentUpdate(survey.assessments, skillSelectedQuestions, dimensions);
                var leaderAssessments = assessmentUpdate(survey.team_leader_assessments, skillSelectedQuestions, dimensions);
                var managerAssessments = assessmentUpdate(survey.manager_assessments, skillSelectedQuestions, dimensions);*/
                
                function selectAssessmentRegisterToSurvey(newSurvey, templateAssessments, skillAssessment, dimensions, role, survey_type) {
                  var assessments = [];
                  var assessmentsRaters = [];
                  var assessmentsTeamMember = [];

                  _.each(templateAssessments, function (assessment) {
                    if (_.includes(dimensions, assessment.tag)) {
                      assessments.push(assessment);
                      if(role == survey_type && assessment.tag == 'BEHAVIORS') {
                        assessmentsRaters.push(assessment);
                        assessmentsTeamMember.push(assessment);
                      }
                    }
                  });
                  
                  if(role != 'leader') {
                    assessments.push(skillAssessment);
                    assessmentsTeamMember.push(skillAssessment);
                  }
                  
                  if(role == survey_type) {
                    newSurvey.availableAssessmentForRaters = assessmentsRaters;  
                    newSurvey.availableAssessmentForTeamMember = assessmentsTeamMember;   
                  }
                 
                  return newSurvey.addAssessments(assessments, role);
                }

                var skillAssessment = Assessment.generateSkillAssessment(survey, skillSelectedQuestions);
                survey = selectAssessmentRegisterToSurvey(survey, template.assessments, skillAssessment, dimensions, 'employee', template.survey_type);
                survey = selectAssessmentRegisterToSurvey(survey, template.team_leader_assessments, skillAssessment, dimensions, 'leader', template.survey_type);
                survey = selectAssessmentRegisterToSurvey(survey, template.manager_assessments, skillAssessment, dimensions, 'manager', template.survey_type);
                
                survey.name = surveyName;
                survey.expiry_date = surveyExpiryDate;
                survey.assignManager = assignManager;

                Survey.update({_id: survey._id}, {$set: {assessments: survey.assessments,
                  team_leader_assessments: survey.team_leader_assessments,
                  manager_assessments: survey.manager_assessments,
                  name: surveyName, expiry_date: surveyExpiryDate, availableAssessmentForRaters: survey.availableAssessmentForRaters, assignManager: survey.assignManager
                }}, function (err, doc) {
                  if (!err) {
                    res.status(200).json({status: 'success', survey: survey})
                  } else {
                    res.status(422).json({status: 'failure', survey: doc, msg: err})
                  }
                })
              })
            })
          })
        })
      });

  app.get('/surveys/:id/user-stats',
      helper.isLoggedIn,
      function (req, res) {
        var surveyId = req.params.id;

        Survey.findOne({_id: surveyId}, function (err, survey) {
          res.status(200).json({status: 'success', surveyProgress: survey.userStats})    
        })
      })
      
  app.post('/survey/share/:id',
    helper.isLoggedIn,
    function (req, res) {
      var surveyId = req.params.id;

      Survey.update({_id: surveyId}, {$set: {isSharedWithManager: true}}, 
      function (err, survey) {
        if (!err) {
          Notification.shareSurveyWithManagerForEditing(surveyId, req.user)
          res.status(200).json({status: 'success', survey: survey})
        } else {
          res.status(422).json({status: 'failure', survey: survey, msg: err})
        }
      });
    }
  );

  app.get('/survey/raw/:id',
    helper.isLoggedIn,
    function (req, res) {
      var surveyId = req.params.id;

      Submission.find({survey: surveyId}).populate('user').exec(function (err, submissions) {
        var processedSubmission = [];
        _.each(submissions, function (submission) {
          var oProcessedSubmission = {};
          oProcessedSubmission.employee_id = submission.user.employee_id;
          oProcessedSubmission.employee_name = submission.user.full_legal_name;
          oProcessedSubmission.tag = submission.tag;
          oProcessedSubmission.answers = submission.optionsSaved;
          oProcessedSubmission.comments = submission.comments;

          processedSubmission.push(oProcessedSubmission);
        });

        SubmissionRaters.find({survey: surveyId}).populate('user userRater').exec(function (err, arrSubmissionRaters) {
          var processedSubmissionRaters = [];
          _.each(arrSubmissionRaters, function (submissionRater) {
            var oProcessedSubmissionRater = {};
            oProcessedSubmissionRater.employee_id = submissionRater.userRater.employee_id;
            oProcessedSubmissionRater.employee_name = submissionRater.userRater.full_legal_name;
            oProcessedSubmissionRater.rater_id = submissionRater.user.employee_id;
            oProcessedSubmissionRater.rater_name = submissionRater.user.full_legal_name;
            oProcessedSubmissionRater.tag = submissionRater.tag;
            oProcessedSubmissionRater.answers = submissionRater.optionsSaved;
            oProcessedSubmissionRater.comments = submissionRater.comments;

            processedSubmissionRaters.push(oProcessedSubmissionRater);
          });

          res.status(200).json({userSubmission: processedSubmission, raterSubmission: processedSubmissionRaters});
        });
      });
    }
  );  

  app.post('/survey/preview',
    helper.isLoggedIn,
    function (req, res) {
      var data = req.body;
      var templateId = data.templateId;
      var dimensions = data.dimensions.split(',');
      /*var questions_skill = data.questions.split(',');
      questions_skill = _.compact(questions); */
      var step = data.step || 0;
      var sectionsCount = dimensions.length;

      Template.findOne({_id: templateId}, function (err, template) {
        //_.each(template.assessments, function (assessment) {
        for(i=0; i<template.assessments.length;i++) {
          if (template.assessments[i].tag == dimensions[step]) {
            questions = template.assessments[i].questions;
            break;
          }
        }

        strHTML = '';
        strHTML += '<form action="/survey/preview" method="post">';
        strHTML += '<div class="row">';  
        strHTML += '<div class="col-md-12">';
        strHTML += '<div class="survey-wrapper">';
        
        strHTML += '<h1 class="s-title text-uppercase">' + dimensions[parseInt(step)] + '</h1>';
        strHTML += '<div class="row">';
        strHTML += '<div class="questions">';
        strHTML += '<input type="hidden" id="previewStep" name="previewStep" value="' + (parseInt(step)+1) + '">';
        strHTML += '<input type="hidden" id="previewPrevStep" name="previewPrevStep" value="' + (parseInt(step)-1)+ '">';
        strHTML += '<input type="hidden" id="previewDimensions" name="previewDimensions" value="' + data.dimensions + '">';
        strHTML += '<input type="hidden" id="previewTemplateId" name="previewTemplateId" value="' + templateId + '">';
        
        for(i=0; i<questions.length; i++){
          

          strHTML += '<div class="question col-md-12">';
          strHTML += '<div class="row">';
          strHTML += '<input name="questions[' + questions[i]._id + ']" class="selected-answer hide">';
          strHTML += '<label data-toggle="tooltip" data-placement="top" title="" class="col-xs-12 col-sm-5 m-b-15" data-original-title="' + questions[i].hint + '">' + questions[i].title + '</label>';
          strHTML += '<div class="col-xs-12 col-sm-7 m-b-15">';
          strHTML += '<ul class="responses">';
          for(j=0; j<questions[i].options.length; j++){
            strHTML += '<li>';
            strHTML += '<input id="' + i.toString() + j.toString() + '" type="radio" name="' + questions[i]._id + '" value="' + j + '">';
            strHTML += '<label for="' + i.toString() + j.toString() + '" class="text-capitalize">' + questions[i].options[j] + '</label>';
            strHTML += '</li>';
          }
          strHTML += '</ul>';
          strHTML += '<span>';
          strHTML += '<input name="question_emotions[' + questions[i]._id + ']" value="false" class="select-emotion-option hide">';
          strHTML += '<button type="button" data-toggle="tooltip" data-placement="top" title="" class="btn emotion-btn btn-not-able-tmj" data-original-title="Not able to make a judgment">';
          strHTML += '<img src="/img/not-able-tmj-icon.svg" alt="">';
          strHTML += '</button>';
          strHTML += '</span>';
          strHTML += '</div>';
          strHTML += '</div>';
          strHTML += '</div>';
        }    
          
        strHTML += '</div>';
        strHTML += '</div>';
        strHTML += '</div>';
          
        strHTML += '<div class="timeline-wrapper">';
        strHTML += '<div class="timeline-header">';
        strHTML += '<div class="text-center">';
        strHTML += '<span class="pull-left">Section ' + (parseInt(step)+1) + '/' + (sectionsCount) + '</span>';
        if(step != 0)
          strHTML += '<div id="prevPreviewNavigation" class="button btn btn-gray submit-assessment-back-type"><img src="/img/arrow-l.png" width="20" height="20" alt=""></div>';
        if((parseInt(step)+1) != sectionsCount)
          strHTML += '<div id="nextPreviewNavigation" class="button btn btn-gray"><img src="/img/arrow-r.png" width="20" height="20" alt=""></div>';
        strHTML += '</div>';
        strHTML += '</div>';
        strHTML += '<div class="timeline">';
        strHTML += '<div class="progress">';
        strHTML += '<div role="progressbar" aria-valuenow="' + (((parseInt(step)+1)/sectionsCount)*100) + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + (((parseInt(step)+1)/sectionsCount)*100) + '%;" class="progress-bar progress-bar-success">';
        strHTML += '<span class="sr-only">' + (((parseInt(step)+1)/sectionsCount)*100) + '% Complete</span>';
        strHTML += '<div data-toggle="tooltip" data-placement="top" title="" class="timeline-circle" data-original-title="' + (((step+1)/sectionsCount)*100) + '%">';
        strHTML += '<div class="timeline-circle-inner"></div>';
        strHTML += '</div>';
        strHTML += '</div>';
        strHTML += '</div>';
        strHTML += '</div>';
        strHTML += '</div>';    
        
        strHTML += '</div>';
        strHTML += '</div>';
        strHTML += '</form>';

        strHTML += '<script>';
        strHTML += 'function previewNavigation(action) {';
        strHTML += 'alert(action);';
        strHTML += 'testFunc();';
        strHTML += '}';
        strHTML += '</script>';
      
        res.status(200).json({status: 'success', strHTML: strHTML})
      });
    });
};
