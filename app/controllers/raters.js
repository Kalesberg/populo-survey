var express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('underscore'),
    helper = require('../../config/helper.js'),
    Survey = mongoose.model('Survey'),
    SurveyRaters = mongoose.model('SurveyRaters'),
    SelectedRaters = mongoose.model('SelectedRaters');
    Notification = mongoose.model('Notification');
    
module.exports = function (app) {
    app.get('/raters/:surveyId',
        helper.isLoggedIn,
        function (req, res) {
            var surveyId = req.params.surveyId;
            Survey.findById(surveyId, function (err, survey) {
                if (err) {
                    res.render('error');
                } else {
                    var selectedRaters = [];
                    var managerComments = '';
                    var status = 'pending';
                    var surveyRaterId = '';
                    var availableRaters = survey.availableRaters.sort(
                                            function(a,b) {
                                                return (a.full_legal_name > b.full_legal_name) ? 1 
                                                : ((b.full_legal_name > a.full_legal_name) ? -1 : 0);
                                            } 
                                          );
                    
                    var availableRaters = _.reject(availableRaters, function (rater) {
                        return String(rater._id) == String(req.user._id);
                    });

                    var managerRater = _.find(availableRaters, function (rater) {
                        return String(rater.employee_id) == String(req.user.manager_id);
                    });
                    
                    SurveyRaters.findOne({
                        survey: survey,
                        user: req.user._id
                    }, function (err, surveyRater) {
                        if (surveyRater) {
                            selectedRaters = surveyRater.selectedRaters; 
                            managerComments = surveyRater.managerComments;
                            status = surveyRater.status;
                            surveyRaterId = surveyRater._id;
                        } 

                        var template = 'employee/raters';
                        
                        User.find({'manager_id':req.user.manager_id}, function (err, users) {
                            if (selectedRaters.length == 0) {
                                var users = _.reject(users, function (preSelectedUser) {
                                    return String(preSelectedUser._id) == String(req.user._id);
                                });
                                
                                if (managerRater){
                                    var obj = {};
                                    obj.user = managerRater;
                                    obj.status = 'on';
                                    obj._id = users.length; 
                                    selectedRaters.push(obj);
                                }                                
                                for (z=0; z<users.length; z++) {
                                    var obj = {};
                                    obj.user = users[z];
                                    obj.status = 'on';
                                    obj._id = z;
                                       
                                    selectedRaters.push(obj);
                                }
                                console.log(selectedRaters);
                            }
                            
                            res.render(template, {
                                user: req.user,
                                userRater: req.user,
                                selectedRaters: selectedRaters, 
                                managerComments: managerComments,
                                availableRaters: availableRaters,
                                survey: survey, 
                                surveyRaterId: surveyRaterId,
                                status: status,
                                approvalStep: false
                            });
                        });
                    });
                }
            })
        }
    );

    app.get('/raters/approval/:surveyRaterId',
        helper.isLoggedIn,
        function (req, res) {
            var surveyRaterId = req.params.surveyRaterId;
            SurveyRaters.findOne({_id: surveyRaterId}).populate('user').exec(function (err, surveyRater) {
                console.log(surveyRater);
                if (err) {
                    res.render('error');
                } else {
                    if(surveyRater.user.manager_id == req.user.employee_id) {
                        var selectedRaters = surveyRater.selectedRaters; 
                        var managerComments = surveyRater.managerComments;
                        var status = surveyRater.status;
                        var surveyId = surveyRater.survey;
                        var raterId = surveyRater.user;
                        
                        Survey.findById(String(surveyId), function (err, survey) {
                            if (err) {
                                res.render('error');
                            } else {
                                var availableRaters = survey.availableRaters.sort(
                                                        function(a,b) {
                                                            return (a.full_legal_name > b.full_legal_name) ? 1 
                                                            : ((b.full_legal_name > a.full_legal_name) ? -1 : 0);
                                                        } 
                                                      );;
                        
                                
                                   
                                var template = 'employee/raters';
                        
                                res.render(template, {
                                    user: req.user,
                                    userRater: surveyRater.user,
                                    selectedRaters: selectedRaters, 
                                    managerComments: managerComments,
                                    availableRaters: availableRaters,
                                    survey: survey, 
                                    surveyRaterId: surveyRaterId,
                                    status: status, 
                                    approvalStep: true
                                });
                            }
                        });
                    }
                    else {
                        res.redirect('/dashboard');
                    }
                }
            })
        }
    );
    
    app.post('/raters/:surveyId',
        helper.isLoggedIn,
        function (req, res) {
            //var surveyId = req.params.surveyId;
            var survey_id = req.body.survey_id;
            Survey.findById(survey_id, function (err, survey) {
                if (err) {
                    res.render('error');
                } else {
                    var rater_id = req.body.rater_id;
                    var survey_rater_id = req.body.survey_rater_id;
                    var selectedRaters = JSON.parse(req.body.selectedRaters);
                    var managerComments = '';
                    var nextStatus = 'pending';
                    
                    if (req.body.replyBtn == 'reply' && (req.user.role == 'Manager' || req.user.role == 'Leader')) {
                        managerComments = req.body.managerComments;
                        nextStatus = 'rejected';
                    }
                    
                    if (req.body.approveBtn == 'approve' && (req.user.role == 'Manager' || req.user.role == 'Leader')) {
                        nextStatus = 'accepted';
                    }

                    if (req.user.role == 'Leader')
                        nextStatus = 'accepted';
                    
                    SurveyRaters.findOne({
                        survey: survey,
                        user: rater_id
                    }, function (err, surveyRater) {
                        if (err) {
                            res.render('error');
                        } else if(surveyRater && surveyRater.status == 'accepted'){
                            res.redirect('/dashboard');
                        } else {
                            if (surveyRater) {
                                selectedRatersOld = surveyRater.selectedRaters;
                                
                                // Delete all the existing selected raters
                                for(i=0; i<selectedRatersOld.length; i++) {
                                    SelectedRaters.find({'_id': selectedRatersOld[i]._id}).remove().exec();
                                }
                            } 
                            else {
                                surveyRater = new SurveyRaters();
                                surveyRater.user = rater_id;
                                surveyRater.survey = survey;
                            }
                            
                            var arrSelectedRaters = [];
                        
                            for(j=0; j<selectedRaters.length; j++) {
                                var bAdded = true;
                                if(!selectedRaters[j].status && nextStatus == 'pending') { 
                                    bAdded = false;
                                }
                                
                                if(bAdded) {
                                    var newSelectedRater = new SelectedRaters();
                                    
                                    userId = selectedRaters[j].id.indexOf("|") > 0 
                                                ? selectedRaters[j].id.substring(0, selectedRaters[j].id.indexOf("|")) 
                                                : selectedRaters[j].id;
                                    
                                    newSelectedRater.user = _.find(survey.availableRaters, function (rater) {
                                        return String(rater._id) == String(userId);
                                    });
                                    
                                    newSelectedRater.status = selectedRaters[j].status ? 'on' : 'off';
                                    newSelectedRater.save();
                                    
                                    arrSelectedRaters.push(newSelectedRater);
                                }
                            }
                            
                            surveyRater.status = nextStatus;
                            surveyRater.managerComments = managerComments;
                            surveyRater.selectedRaters = arrSelectedRaters;
                            surveyRater.save();
                            
                            if (nextStatus == 'pending') {
                                Notification.multiRatersApprovalNotification(req.user, surveyRater);
                            }
                            else if (nextStatus == 'rejected') {
                                Notification.multiRatersRejectionNotification(req.user, rater_id, survey);
                            }
                            else if (nextStatus == 'accepted') {
                                bLeader = false;
                                if (req.user.role == 'Leader')
                                    bLeader = true;

                                Notification.multiRatersTakeSurveyNotification(rater_id, arrSelectedRaters, surveyRater, bLeader);
                            }
                            res.redirect('/dashboard');
                        }
                    });
                }
            });
        }
    );
};
