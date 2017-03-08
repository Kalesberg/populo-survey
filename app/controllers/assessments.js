var express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('underscore'),
    helper = require('../../config/helper.js'),
    Assessment = mongoose.model('Assessment'),
    Survey = mongoose.model('Survey'),
    Submission = mongoose.model('Submission'),
    Question = mongoose.model('Question'),
    Comment = mongoose.model('Comment'),
    Answer = mongoose.model('Answer'),
    jade = require('jade');

module.exports = function (app, config) {
  app.get('/assessments/:surveyId',
      helper.isLoggedIn,
      function (req, res) {
        var surveyId = req.params.surveyId;
        var user = req.user;
        var step = req.params.step || 0;

        Survey.findById({_id: surveyId}, function (err, survey) {
          if (err) {
            res.render('error');
          } else {
            var assessments = survey.getAssessments(user);
            var surveyStatus = survey.status(user, step);
            var requestedAssessment = assessments[step];
            var sectionsCount = assessments.length;

            Submission.findOne({
              survey: survey,
              assessment: requestedAssessment,
              user: user
            }, function (err, submission) {

              var template = 'employee/' + (submission ? 'edit_assessment' : 'assessments');
              var questions = requestedAssessment.questions;    

              res.render(template, {
                user: req.user,
                assessment: requestedAssessment, completedQuestions: surveyStatus['completedQuestions'],
                questionsCount: surveyStatus['questionsCount'], survey: survey, step: step, questions: questions, sectionsCount: sectionsCount,
                statusPercentage: surveyStatus['percent'], submission: submission
              })
            });
          }
        })
      });

  app.post('/assessments/:surveyId',
      helper.isLoggedIn,
      function (req, res) {
        var reqBody = req.body;
        var user = req.user;
        var surveyId = req.params.surveyId;
        req.session.surveyId = surveyId;
        var step = parseInt(reqBody.step) || 0;
        var prevStep = parseInt(reqBody.prevStep) || 0;

        if (reqBody.backBtn == 'back') {
          step = step - 2;
        } else if (reqBody.submitBtn == 'submit') {
          step = step - 1;
        } else if (reqBody.saveBtn == 'save') {
          step = step - 1;
        }

        Survey.findById(surveyId, function (err, survey) {
          if (err) {
            res.render('error');
          } else {
              var assessments = survey.getAssessments(user);
              var sectionsCount = assessments.length;

            if (assessments.length > step) {
              var surveyStatus = survey.status(user, step);
              var assessment = assessments[step];

              if (req.body.backBtn == 'back') {
                var submitAssessment = assessments[step + 1];
              } else if (req.body.submitBtn == 'submit') {
                var submitAssessment = assessments[step];
                var assessment = assessments[step];
              } else if (req.body.saveBtn == 'save') {
                var submitAssessment = assessments[step];
                var assessment = assessments[step];
              } else {
                var submitAssessment = assessments[step - 1];
              }

              Submission.findOne({
                    survey: survey,
                    assessment: submitAssessment,
                    user: user
                  }, function (err, submission) {

                    if (submission) {
                      console.log('Update existing');
                      submission.answers = [];
                      submission.comments = [];
                    } else {
                      console.log('Creating submission record');
                      var submission = new Submission();
                      submission.survey = survey;
                      submission.assessment = submitAssessment;
                      submission.tag = submitAssessment.tag;
                      submission.user = user;
                    }

                    if (submitAssessment.tag == 'SKILLS') {
                      submission.state = 'submit';
                    }

                    var questionIds = _.map(reqBody.questions, function (answerOption, questionId) {
                      return questionId
                    });

                    var commentIds = _.map(reqBody.comments, function (commentAnswer, commentId) {
                      return commentId;
                    });

                    Question.find({'_id': {$in: questionIds}}, function (err, questions) {
                      var answers = _.map(questions, function (question) {
                        var answer = new Answer();
                        var questionId = question._id;
                        answer.user = user;
                        answer.question = question;

                        if (reqBody.question_emotions[questionId] == 'true') {
                          answer.selectedOption = '';
                        } else {
                          answer.selectedOption = reqBody.questions[questionId];
                        }

                        answer.selectedEmotion = reqBody.question_emotions[questionId];
                        answer.save();
                        return answer;
                      });

                      Question.find({'_id': {$in: commentIds}}, function (err, commentedQuestions) {
                        var comments = _.map(commentedQuestions, function (commentQuestion) {
                          var comment = new Comment();
                          var commentId = commentQuestion._id;

                          comment.question = commentId;
                          comment.answerText = reqBody.comments[commentId];
                          comment.save();
                          return comment;
                        });

                        submission.answers = answers;
                        submission.comments = comments;
                        submission.save(function () {

                          Submission.updateUserProgress(submission);
                          Submission.findOne({
                            survey: survey,
                            assessment: assessment,
                            user: user
                          }, function (err, submissionQuestions) {


                            var template = 'employee/';
                            if (assessment.tag == 'SKILLS') {
                              template += (submissionQuestions ? 'edit_skill_assessment' : 'skill_assessments');
                            } else {
                              template += (submissionQuestions ? 'edit_assessment' : 'assessments');
                            }

                            if (reqBody.submitBtn == 'submit') {
                              survey.submissionNotificationRead(user._id);
                              var html = jade.renderFile('./app/views/employee/survey_submitted_thankyou_email.jade', {user_name: user.full_legal_name});

                              var mailOptions = {
                                subject: 'Your populo survey has been completed',
                                from: config.SMTPUsername,
                                to: user.email,
                                text: html,
                                html: html
                              };

                              app.smtpTransport.sendMail(
                                mailOptions,
                                function(error, info) {
                                  
                                  if (error) {
                                    return console.log(error);
                                  }
                                  console.log('Message sent: ' + info.response);
                                }
                              );
                              
                              return res.redirect('/submission'); //it is important to return all res.redirection statements.                              
                            }

                            var questions = assessment.questions;

                            res.render(template, {
                              user: user,
                              assessment: assessment,
                              completedQuestions: surveyStatus['completedQuestions'],
                              questionsCount: surveyStatus['questionsCount'],
                              survey: survey,
                              step: step,
                              questions: questions,
                              statusPercentage: surveyStatus['percent'],
                              prevStep: prevStep,
                              submission: submissionQuestions,
                              sectionsCount: sectionsCount 
                            });
                          });
                        });
                      });
                    });
                  }
              )
            }
            else {
              survey.submissionNotificationRead(user._id);
              res.redirect('/submission');
            }
          }
        })
      }
  )
};
