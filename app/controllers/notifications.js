var express = require('express'),
    _ = require('underscore'),
    jade = require('jade'),
    mongoose = require('mongoose'),
    Survey = mongoose.model('Survey'),
    helper = require('../../config/helper.js'),
    Assessment = mongoose.model('Assessment'),
    User = mongoose.model('User'),
    Notification = mongoose.model('Notification');

module.exports = function (app, config) {
  app.get('/notifications/:notificationId',
      helper.isLoggedIn,
      function (req, res) {
        var notificationId = req.params.notificationId;

        Notification.findOne({_id: notificationId}, function (err, notification) {
          if (err) {
            res.render('error');
          } else {
            var redirect_url = notification.redirectSourceURL();
            res.redirect(redirect_url);
          }
        })
      });

  app.get('/submission',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var surveyId = req.session.surveyId;

        var requestedUrl = req.protocol + '://' + req.get('host');

        //user.generateReport(requestedUrl);
        Notification.readSubmissionNotification(user, surveyId);

        res.render('employee/submission', {
          user: req.user, bMultiRater: false
        });
      });
      
  app.get('/raters/submission',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/submission', {
          user: req.user, bMultiRater: true
        });
      });
    
  app.get('/notifications',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        Notification.find({notifierId: user._id, read: false}, function (err, notifications) {
          Survey.find({}, function (err, surveys) {
            User.findOne({employee_id: user.employee_id},
                function (err) {
                    var response = {
                      message: req.flash('successfully loggedin'), user: user,
                      notifications: notifications.reverse(), userName: user.full_legal_name
                    };
 
                   res.render('employee/notifications', response);
                 
                });
          })
        })
      });    
    
  app.get('/send/reminders/:surveyId', function (req, res) {
    var surveyId = req.params.surveyId;

    var hostname = req.headers.host;
    var protocol = 'http';
    Survey.findOne(surveyId, function(err, survey){
      _.each(survey.assignees, function(user){
        var survey_link = protocol + '://' + hostname + '/assessments/' + survey._id;
        var html = jade.renderFile('./app/views/hr-manager/email_reminder.jade', {user: user, survey_link: survey_link});

        var mailOptions = {
          from: config.SMTPUsername,
          to: user.email,
          subject: 'Submit Assessment',
          html: html,
          text: html
        };

        app.smtpTransport.sendMail(mailOptions, function(error, info){
          if(error){
            return console.log(error);
          }
          console.log('Message sent: ' + info.response);
        });

//        Submitting Reminder Notifications
//        survey.surveyReminder(req.user, user);
      });

      res.status(200).json({status: 'success'});
    });
  });
};
