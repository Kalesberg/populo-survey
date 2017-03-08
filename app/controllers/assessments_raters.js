var express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('underscore'),
    helper = require('../../config/helper.js'),
    Assessment = mongoose.model('Assessment'),
    Survey = mongoose.model('Survey'),
    SurveyRaters = mongoose.model('SurveyRaters'),
    Submission = mongoose.model('Submission'),
    SubmissionRaters = mongoose.model('SubmissionRaters'),
    Question = mongoose.model('Question'),
    Comment = mongoose.model('Comment'),
    Answer = mongoose.model('Answer');
    Notification = mongoose.model('Notification');

module.exports = function (app) {
    app.get('/assessments/raters/:surveyRaterId',
        helper.isLoggedIn,
        function (req, res) {
            var surveyRaterId = req.params.surveyRaterId;
            var user = req.user;
            var step = req.params.step || 0;

            SurveyRaters.findOne({_id: surveyRaterId}).populate('user').exec(function (err, surveyRater) {
                if (err) {
                    res.render('error');
                } else {
                    var surveyId = surveyRater.survey;
                    var surveyRaterStatus = surveyRater.status;
                    var surveyRaterUser = surveyRater.user._id;
                    var selectedRaters = surveyRater.selectedRaters;
            
                    if (surveyRaterStatus != 'accepted') {
                        // Transfer user to dashboard
                        res.redirect('/dashboard');
                    }
            
                    selectedRaterExist = _.find(selectedRaters, function (selectedRater) {
                        return String(selectedRater.user._id) == String(user._id) && selectedRater.status == 'on';
                    });
                    
                    if (selectedRaterExist == null) {
                        // Transfer user to dashboard
                        res.redirect('/dashboard');
                    }
                    
                    bTeamRaters = false;
                    if(surveyRater.user.manager_id == user.manager_id || 
                        surveyRater.user.manager_id == user.employee_id) {
                        bTeamRaters = true;
                    }
                    
                    Survey.findById(surveyId, function (err, survey) {
                        if (err) {
                            res.render('error');
                        } else {
                            var raterAssessments = survey.getRaterAssessments(user, bTeamRaters);
                            var surveyStatus = survey.statusRater(user, step, bTeamRaters);
                            var requestedAssessment = raterAssessments[step];
                            //var instructionsTxt = Assessment.instructionTxt(requestedAssessment, surveyRaterUser);
                            var sectionsCount = raterAssessments.length;

                            SubmissionRaters.findOne({
                                survey: survey,
                                assessment: requestedAssessment,
                                user: user,
                                userRater: surveyRaterUser
                            }, function (err, submission) {

                                var template = 'employee/' + (submission ? 'edit_assessment' : 'assessments');
                                //var buttonsText = Assessment.buttonText(requestedAssessment, surveyRaterUser);
                                var questions = requestedAssessment.questions;

                                res.render(template, {
                                    user: req.user,
                                    surveyRaterId: surveyRaterId, 
                                    raterAssessment: true,
                                    assessment: requestedAssessment, completedQuestions: surveyStatus['completedQuestions'],
                                    questionsCount: surveyStatus['questionsCount'], survey: survey, step: step, questions: questions,
                                    statusPercentage: surveyStatus['percent'], submission: submission,
                                    // buttonsText: buttonsText,
                                    // instructionsTxt:instructionsTxt[1],
                                    sectionsCount:sectionsCount
                                })
                            });
                        }
                    })
                }
            })   
        }
    );

    app.post('/assessments/raters/:surveyRaterId',
        helper.isLoggedIn,
        function (req, res) {
            var reqBody = req.body;
            var user = req.user;
            var surveyRaterId = req.params.surveyRaterId;
            var step = parseInt(reqBody.step) || 0;
            var prevStep = parseInt(reqBody.prevStep) || 0;

            if (reqBody.backBtn == 'back') {
              step = step - 2;
            } else if (reqBody.submitBtn == 'submit') {
              step = step - 1;
            } else if (reqBody.saveBtn == 'save') {
              step = step - 1;
            }

            SurveyRaters.findById(surveyRaterId, function (err, surveyRater) {
                if (err) {
                    res.render('error');
                } else {
                    var surveyId = surveyRater.survey;
                    var surveyRaterStatus = surveyRater.status;
                    var surveyRaterUser = surveyRater.user
                    var selectedRaters = surveyRater.selectedRaters;
            
                    if (surveyRaterStatus != 'accepted') {
                        // Transfer user to dashboard
                        res.redirect('/dashboard');
                    }
            
                    selectedRaterExist = _.find(selectedRaters, function (selectedRater) {
                        return String(selectedRater.user._id) == String(user._id) && selectedRater.status == 'on';
                    });
                    
                    if (selectedRaterExist == null) {
                        // Transfer user to dashboard
                        res.redirect('/dashboard');
                    }
            
                    Survey.findById(surveyId, function (err, survey) {
                        if (err) {
                            res.render('error');
                        } else {
                            var assessments = survey.getRaterAssessments(user, bTeamRaters);
                            var sectionsCount = assessments.length;

                            if (assessments.length > step) {
                                var surveyStatus = survey.statusRater(user, step, bTeamRaters);
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

                                SubmissionRaters.findOne({
                                    survey: survey,
                                    assessment: submitAssessment,
                                    user: user,
                                    userRater: surveyRaterUser
                                }, function (err, submission) {
                                    if (submission) {
                                        console.log('Update existing');
                                        submission.answers = [];
                                        submission.comments = [];
                                    } else {
                                        console.log('Creating submission record');
                                        var submission = new SubmissionRaters();
                                        submission.survey = survey;
                                        submission.assessment = submitAssessment;
                                        submission.tag = submitAssessment.tag;
                                        submission.user = user;
                                        submission.userRater = surveyRaterUser;
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
                                                //SubmissionRaters.updateUserProgress(submission);
                                                SubmissionRaters.findOne({
                                                    survey: survey,
                                                    assessment: assessment,
                                                    user: user,
                                                    userRater: surveyRaterUser
                                                }, function (err, submissionQuestions) {
                                                    var template = 'employee/';
                                                    if (assessment.tag == 'SKILLS') {
                                                        template += (submissionQuestions ? 'edit_skill_assessment' : 'skill_assessments');
                                                    } else {
                                                        template += (submissionQuestions ? 'edit_assessment' : 'assessments');
                                                    }

                                                    if (reqBody.submitBtn == 'submit') {
                                                        Notification.multiRatersSurveySubmissionNotification(user, surveyRaterUser);
                                                        res.redirect('/raters/submission');
                                                    }

                                                    //var buttonsText = Assessment.buttonText(assessment, user);
                                                    var questions = assessment.questions;
                                                    //var instructionsTxt = Assessment.instructionTxt(assessment, user);

                                                    res.render(template, {
                                                        user: user, 
                                                        surveyRaterId: surveyRaterId,
                                                        raterAssessment: true,
                                                        assessment: assessment, completedQuestions: surveyStatus['completedQuestions'],
                                                        questionsCount: surveyStatus['questionsCount'], survey: survey, step: step,
                                                        questions: questions, statusPercentage: surveyStatus['percent'], prevStep: prevStep,
                                                        submission: submissionQuestions, 
                                                        //buttonsText: buttonsText,
                                                        //instructionsTxt:instructionsTxt[1],
                                                        sectionsCount:sectionsCount
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            }
                            else {
                                Notification.multiRatersSurveySubmissionNotification(user, surveyRaterUser);
                                res.redirect('/raters/submission');
                            }
                        }
                    });
                }
            });                        
        }    
    );
};
