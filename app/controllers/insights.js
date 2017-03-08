var express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Survey = mongoose.model('Survey'),
    Submission = mongoose.model('Submission'),
    SubmissionRaters = mongoose.model('SubmissionRaters'),
    _ = require('underscore'),
    helper = require('../../config/helper.js');

module.exports = function (app) {
  app.post('/getInsights',
      helper.isLoggedIn,
      function (req, res) {
        var individualId = req.body.individual;
        var assessmentType = req.body.assessmentType;
        var assessmentType_bkup = req.body.assessmentType;

        var employeeManagerEffectiveness = [];
        var employeeTeamEffectiveness = [];
        var employeeManagerRating = [];
        var multiRaters = [];
        var employeeTeamRating = [];
        if(assessmentType == 'MANAGER EFFECTIVENESS') {
            //individualId = req.body.manager;
            if(req.user.userType == 'Manager' || req.user.userType == 'Leader' || 
                    (req.user.userType == 'HR Manager' && req.user.full_legal_name == req.body.manager)) {
                individualId = req.user.full_legal_name;
                assessmentType = "SELF EFFECTIVENESS";
            }
        }
        
        User.findOne({full_legal_name: individualId}, function (err, user) {
          if (user) {
            Survey.findOne({state: 'started', "assignees.full_legal_name": individualId}, function (err, survey) {
              if (survey) {
                Submission.findOne({survey: survey._id, tag: assessmentType, user: user._id},
                    function (err, submission) {
                      if (submission) {
                        var submissionQA = submission.getQuestionsAndAnswers();
                      } else {
                        var isEmpty = true;
                        var submissionQA = {answers: [], questions: []};
                      }
                      
                      // Multi-Raters Data for Chart
                      
                      SubmissionRaters.find({userRater: user._id, tag: assessmentType}).populate('user assessment').then(function (submissionRaters) {                  
                        _.each(submissionRaters, function (submissionRater) {
                            if(user.manager_id == submissionRater.user.employee_id)
                                employeeManagerRating.push(submissionRater.getQuestionsAndAnswers());
                            else if(user.manager_id == submissionRater.user.manager_id)
                                employeeTeamRating.push(submissionRater.getQuestionsAndAnswers());
                            else
                                multiRaters.push(submissionRater.getQuestionsAndAnswers());
                        });
                        
                        if(assessmentType_bkup == 'MANAGER EFFECTIVENESS') {
                            Survey.findOne({state: 'started'}).populate({path: 'templateId', match: {survey_type: 'employee'}}).exec(function (err, survey1) {
                                if(survey1) {
                                    Submission.find({survey: survey1._id, tag: assessmentType_bkup}).populate({path: 'user', match: {manager_id: user._id}}).exec(function (err, submissions) {
                                        _.each(submissions, function (submission1) {
                                            employeeManagerEffectiveness.push(submission1.getQuestionsAndAnswers());
                                        });
                                        
                                        res.json({status: 'success', submissionQA: submissionQA, isEmpty: isEmpty, 
                                            multiRaters: multiRaters, user: user, employeeManagerEffectiveness: employeeManagerEffectiveness, 
                                            employeeTeamEffectiveness: employeeTeamEffectiveness, employeeManagerRating: employeeManagerRating, 
                                            employeeTeamRating: employeeTeamRating, user: req.user});
                                    });
                                }
                                else {
                                    console.log('No employeeManagerEffectiveness');
                                    res.json({status: 'success', submissionQA: submissionQA, isEmpty: isEmpty, 
                                        multiRaters: multiRaters, user: user, employeeManagerEffectiveness: employeeManagerEffectiveness, 
                                        employeeTeamEffectiveness: employeeTeamEffectiveness, employeeManagerRating: employeeManagerRating, 
                                        employeeTeamRating: employeeTeamRating, user: req.user});
                                }
                            });
                        } 
                        else if(assessmentType == 'TEAM EFFECTIVENESS') {
                            Submission.find({survey: survey._id, tag: assessmentType, user: {$ne: user._id}}).populate({path: 'user', match: {manager_id: user.manager_id}}).exec(function (err, submissions) {
                                _.each(submissions, function (submission1) {
                                    employeeTeamEffectiveness.push(submission1.getQuestionsAndAnswers());
                                });
                                
                                res.json({status: 'success', submissionQA: submissionQA, isEmpty: isEmpty, 
                                    multiRaters: multiRaters, user: user, employeeManagerEffectiveness: employeeManagerEffectiveness, 
                                    employeeTeamEffectiveness: employeeTeamEffectiveness, employeeManagerRating: employeeManagerRating, 
                                    employeeTeamRating: employeeTeamRating, user: req.user});
                            });
                        }
                        else {
                            res.json({status: 'success', submissionQA: submissionQA, isEmpty: isEmpty, 
                                    multiRaters: multiRaters, user: user, employeeManagerEffectiveness: employeeManagerEffectiveness, 
                                    employeeTeamEffectiveness: employeeTeamEffectiveness, employeeManagerRating: employeeManagerRating, 
                                    employeeTeamRating: employeeTeamRating, user: req.user});
                        }
                      });
                    })
              } else {
                res.json({status: 'failure'});
              }
            });
          } else {
            res.json({status: 'user not found: ' + individualId});
          }
        })
      });


  app.get('/insights-on/:checked',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var isInsightsOn = req.params.checked;
        console.log(isInsightsOn);

        User.find({$or: [{role: 'Manager'}, {role: 'Leader'}, {role: 'HR Manager'}]}, function (err, users) {
            _.each(users, function (user) {
                user.insights_on = isInsightsOn;
                user.save();
            });

            res.status(200).json({status: 'success'});
        });
      }
  );

  app.get('/getReformedJSON',
      function (req, res) {
            Question = mongoose.model('Question');
            QuestionBank = mongoose.model('Questionbank');
            Assessment = mongoose.model('Assessment');
            Template = mongoose.model('Template');
            Survey = mongoose.model('Survey');
            Answer = mongoose.model('Answer');
            Comment = mongoose.model('Comment');
            Submission = mongoose.model('Submission');
            SubmissionRaters = mongoose.model('SubmissionRaters');

        var reformedJSON = {};
        Question.find({}, function (err, questions) {
            reformedJSON.questions = questions;
            QuestionBank.find({}, {update_at: 1, created_at: 1, "questions._id": 1, __v: 1}, function (err, questionbanks) {
                reformedJSON.questionbanks = questionbanks;
                Assessment.find({}, {tag: 1, updated_at: 1, created_at: 1, "comment_questions._id": 1, "questions._id": 1}, function (err, assessments) {
                    reformedJSON.assessments = assessments;
                    Template.find({}, {question_bank: 1, survey_type: 1, title: 1, updated_at: 1, created_at: 1, selected_dimensions: 1, "team_leader_assessments._id": 1, "manager_assessments._id": 1, "assessments._id": 1}, function (err, templates) {
                        reformedJSON.templates = templates;
                        User.find({}, function (err, users) {
                            reformedJSON.users = users;
                            Survey.find({}, {"created_user._id": 1, templateId: 1, state: 1, expiry_date: 1, name: 1, userStats: 1, updated_at: 1, created_at: 1, overallProgress: 1, "availableAssessmentForTeamMember._id": 1, "availableAssessmentForRaters._id": 1, "availableRaters._id": 1, archive: 1, isSharedWithManager: 1, assignManager: 1, raters: 1, "assignees._id": 1, "team_leader_assessments._id": 1, "manager_assessments._id": 1, "assessments._id": 1}, function (err, surveys) {
                                reformedJSON.surveys = surveys;
                                Answer.find({}, function (err, answers) {
                                    reformedJSON.answers = answers;
                                    Comment.find({}, function (err, comments) {
                                        reformedJSON.comments = comments;
                                        Submission.find({}, {user: 1, tag: 1, assessment: 1, survey: 1, updated_at: 1, created_at: 1, "comments._id": 1, "answers._id": 1}, function (err, submissions) {
                                            reformedJSON.submissions = submissions;
                                            SubmissionRaters.find({}, {user: 1, userRater: 1, tag: 1, assessment: 1, survey: 1, updated_at: 1, created_at: 1, "comments._id": 1, "answers._id": 1}, function (err, submissionsRaters) {
                                                reformedJSON.submissionsRaters = submissionsRaters;
                                                
                                                res.status(200).json({reformedJSON: reformedJSON});
                                            });
                                        });
                                    });
                                });
                            });
                        });                        
                    });
                });
            });
        });
      }
  );

  app.get('/getMLInsights',
      function (req, res) {
        Insights = mongoose.model('Insights');
        
        var insightsJSON = new Array();
        Insights.find({}, function (err, insightsData) {
            _.each(insightsData, function (insightData) {
                insightsJSON.push(insightData);
            });
            res.status(200).json(insightsJSON);
        });
      }
  );

  app.get('/runMLInsights',
      function (req, res) {
        var util = require('util'),
            exec = require('child_process').exec,
            child;

        child = exec('. insights/venv/bin/activate && python insights/insights.py', // command line argument directly in string
          function (error, stdout, stderr) {      // one easy function to capture data/errors
            status = 'Some Error'
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null)
              status = 'Some Error: ' + error;
            else 
              status = 'Successful: ' + stdout;

            res.status(200).json(status);
        });
      }
  );
};