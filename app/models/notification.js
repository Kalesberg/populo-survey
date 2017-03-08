'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

module.exports = function(serverEmitter){
  var fields = {
    title: {
      type: String
    },
    text: {
      type: String
    },
    url: {
      type: String
    },
    read: {
      type: Boolean,
      default: false
    },
    todoNotification: {
      type: Boolean,
      default: true
    },
    popupRead: {
      type: Boolean,
      default: false
    },
    notifierId: {
      type: String
    },
    type: {},
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  };

  var notificationSchema = new Schema(fields);

  notificationSchema.statics.readSubmissionNotification = function readSubmissionNotification(user, surveyId) {
    var Survey = mongoose.model('Survey');
    var Notification = mongoose.model('Notification');

    Notification.find({notifierId: user._id, 'type.notificationType': 'SurveySubmission'}, function(err, notifications){
      notifications.forEach(function(notification){
        notification.readNotification();

        notification.save(function(doc){
          console.log(doc);
        });
      })
    });

    Survey.findById(surveyId, function(err, survey) {
      Notification.findOne({notifierId: user._id, 'type.notificationType': 'Survey'}, function (err, notification) {
        notification.readNotification();

        var notification = new Notification();

        notification.title = 'Survey Completed';
        notification.text = 'Thank you for completing your growth survey.';
        notification.url = '/notifications/' + notification._id;
        notification.notifierId = user._id;
        notification.read = false;
        notification.type = {
          initiatorId: user._id,
          notifierId: user._id,
          typeId: survey._id,
          notificationType: 'SurveySubmission'
        };

        notification.save(function (err, notification) {
          console.log('Notification Placed successfully -> ' + notification._id);
          serverEmitter.emit('newNotification', notification);
        });
      });
    });
  };

  notificationSchema.methods.redirectSourceURL = function redirectSourceURL() {
    var url = '';
    //this.read = true;
    //this.save();

    if (this.type.notificationType == 'Survey') {
      url = '/assessments/' + this.type.typeId;
    } else if (this.type.notificationType == 'Multi-Raters-Selection') {
      url = '/raters/' + this.type.typeId;
    } else if (this.type.notificationType == 'Multi-Raters-Selection-Thank-You') {
      url = '/dashboard';
    } else if (this.type.notificationType == 'Multi-Raters-Approval') {
      url = '/raters/approval/' + this.type.typeId;
    } else if (this.type.notificationType == 'Multi-Raters-Approval-Thank-You') {
      url = '/raters/approval/' + this.type.typeId;
    } else if (this.type.notificationType == 'Multi-Raters-Rejection') {
      url = '/raters/' + this.type.typeId;
    } else if (this.type.notificationType == 'Multi-Raters-Take-Survey') {
      url = '/assessments/raters/' + this.type.typeId;
    } else if (this.type.notificationType == 'Multi-Raters-Take-Survey-Thank-You-Initiator') {
      url = '/dashboard';
    } else if (this.type.notificationType == 'Multi-Raters-Take-Survey-Thank-You') {
      url = '/dashboard';
    } else if (this.type.notificationType == 'GrowthPlan-Manager-Send-Report') {
      url = '/growth-plan/' + this.type.typeId;
    } else if (this.type.notificationType == 'Survey-for-Modification') {
      url = this.type.typeId;
    } else if (this.type.notificationType == 'Goal-Feedback') {
      url = this.type.typeId;
    } else {
      url = '/assessments/' + this.type.typeId;
      //    this.readNotification();
    }
    this.popupReadNotification();
    return url;
  };

  notificationSchema.methods.readNotification = function readNotification(){
    this.read = true;
    this.popupRead = true;
    this.save(function (err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully mark as read');
      }
    });
  };

  notificationSchema.methods.popupReadNotification = function popupReadNotification(){
    this.popupRead = true;
    this.save(function (err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully mark as popup read');
      }
    });
  };

  notificationSchema.statics.multiRatersApprovalNotification = function multiRatersApprovalNotification(user, surveyRater) {
    var User = mongoose.model('User');
    var Notification = mongoose.model('Notification');

    // TODO: Send notification to their reporting manager only, not all the manager
    // Mark read all the existing same notification to avoid duplication
    Notification.find({'type.initiatorId': user._id, 'type.notificationType': 'Multi-Raters-Approval'}, function(err, notifications){
      notifications.forEach(function(notification){
        notification.readNotification();
        notification.save();
      })
    });

    var newNotification = new Notification();

    newNotification.title = 'Multi-Raters Approval';
    newNotification.text = 'Request for approval of multi-raters successfully submitted.';
    newNotification.url = '/notifications/' + newNotification._id;
    newNotification.notifierId = user._id;
    newNotification.read = false;
    newNotification.todoNotification = false;
    newNotification.type = {
      initiatorId: user._id,
      notifierId: user._id,
      typeId: '#',
      notificationType: 'Multi-Raters-Selection-Thank-You'
    };

    newNotification.save(function (err, notification) {
      console.log('Notification Placed successfully -> ' + notification._id);
      serverEmitter.emit('newNotification', notification);
    });

    // Create new notification
    User.findOne({employee_id: user.manager_id}, function (err, manager) {
      /*for (var k=0; k<users.length; k++) {
        if(users[k].role == 'Manager') {*/
          var newNotification = new Notification();

          newNotification.title = 'Multi-Raters Approval';
          newNotification.text = user.full_legal_name + ' is seeking approval for multi-raters.';
          newNotification.url = '/notifications/' + newNotification._id;
          newNotification.notifierId = manager._id; // users[k]._id;
          newNotification.read = false;
          newNotification.type = {
            initiatorId: user._id,
            notifierId: manager._id, // users[k]._id,
            typeId: surveyRater._id,
            notificationType: 'Multi-Raters-Approval'
          };

          newNotification.save(function (err, notification) {
            console.log('Notification Placed successfully -> ' + notification._id);
            serverEmitter.emit('newNotification', notification);
          });
        /*}
      }*/
    });

    // Mark current multi-raters selection notification as read
    Notification.findOne({notifierId: user._id, 'type.notificationType': 'Multi-Raters-Selection'}, function (err, notification) {
      if (notification) {
        notification.readNotification();
        notification.save();
      }
    });
    Notification.findOne({notifierId: user._id, 'type.notificationType': 'Multi-Raters-Rejection'}, function (err, notification) {
      if (notification) {
        notification.readNotification();
        notification.save();
      }
    });
  };

  notificationSchema.statics.multiRatersRejectionNotification = function multiRatersRejectionNotification(user, userRaterId, survey) {
    var User = mongoose.model('User');
    var Notification = mongoose.model('Notification');

    // Mark read all the existing same notification to avoid duplication
    Notification.find({notifierId: userRaterId, 'type.notificationType': 'Multi-Raters-Rejection'}, function(err, notifications){
      notifications.forEach(function(notification){
        notification.readNotification();
        notification.save();
      })
    });

    // Create new notification
    var newNotification = new Notification();
    newNotification.title = 'Multi-Raters Rejection';
    newNotification.text = 'Your manager has rejected your multi-raters for growth survey, please select again.';
    newNotification.url = '/notifications/' + newNotification._id;
    newNotification.notifierId = userRaterId;
    newNotification.read = false;
    newNotification.type = {
      initiatorId: user._id,
      notifierId: userRaterId,
      typeId: survey._id,
      notificationType: 'Multi-Raters-Rejection'
    };
    newNotification.save(function (err, notification) {
      console.log('Notification Placed successfully -> ' + notification._id);
      serverEmitter.emit('newNotification', notification);
    });

    // Mark current approval notification as read
    User.findById(userRaterId, function (err, user) {
      Notification.find({'type.initiatorId': user._id, 'type.notificationType': 'Multi-Raters-Approval'}, function(err, notifications){
        notifications.forEach(function(notification){
          notification.readNotification();
          notification.save();
        })
      });
    });
  };

  notificationSchema.statics.multiRatersTakeSurveyNotification = function multiRatersTakeSurveyNotification(userRaterId, selectedUsers, surveyRater, bLeader) {
    var User = mongoose.model('User');
    var Notification = mongoose.model('Notification');

    // Mark read all the existing same notification to avoid duplication
    Notification.find({'type.initiatorId': userRaterId, 'type.notificationType': 'Multi-Raters-Take-Survey'}, function(err, notifications){
      notifications.forEach(function(notification){
        notification.readNotification();
        notification.save();
      })
    });

    // Create new notification
    User.findById(userRaterId, function (err, user) {

      if (!bLeader) {
        var newNotification = new Notification();

        newNotification.title = 'Multi-Raters Approval';
        newNotification.text = 'Your manager has approved your multi-raters for growth survey.';
        newNotification.url = '/notifications/' + newNotification._id;
        newNotification.notifierId = user._id;
        newNotification.read = false;
        newNotification.todoNotification = false;
        newNotification.type = {
          initiatorId: user._id,
          notifierId: user._id,
          typeId: surveyRater._id,
          notificationType: 'Multi-Raters-Approval-Thank-You'
        };

        newNotification.save(function (err, notification) {
          console.log('Notification Placed successfully -> ' + notification._id);
          serverEmitter.emit('newNotification', notification);
        });
      }

      for (var k=0; k<selectedUsers.length; k++) {
        if(selectedUsers[k].status == 'on') {
          var newNotification = new Notification();

          newNotification.title = 'Multi-Raters Survey';
          newNotification.text = user.full_legal_name + ' selected you as a multi-rater, please provide feedback on his/her behaviors.';
          newNotification.url = '/notifications/' + newNotification._id;
          newNotification.notifierId = selectedUsers[k].user._id;
          newNotification.read = false;
          newNotification.type = {
            initiatorId: user._id,
            notifierId: selectedUsers[k].user._id,
            typeId: surveyRater._id,
            notificationType: 'Multi-Raters-Take-Survey'
          };

          newNotification.save(function (err, notification) {
            console.log('Notification Placed successfully -> ' + notification._id);
            serverEmitter.emit('newNotification', notification);
          });
        }
      }

      // Mark current approval notification as read
      Notification.find({'type.initiatorId': user._id, 'type.notificationType': 'Multi-Raters-Approval'}, function(err, notifications){
        notifications.forEach(function(notification){
          notification.readNotification();
          notification.save();
        })
      });

      if (bLeader) {
        // Mark current multi-raters selection notification as read
        Notification.findOne({notifierId: user._id, 'type.notificationType': 'Multi-Raters-Selection'}, function (err, notification) {
          if (notification) {
            notification.readNotification();
            notification.save();
          }
        });
        Notification.findOne({notifierId: user._id, 'type.notificationType': 'Multi-Raters-Rejection'}, function (err, notification) {
          if (notification) {
            notification.readNotification();
            notification.save();
          }
        });
      }
    });
  };

  notificationSchema.statics.multiRatersSurveySubmissionNotification = function multiRatersSurveySubmissionNotification(user, userRaterId) {
    var User = mongoose.model('User');
    var Notification = mongoose.model('Notification');

    var newNotification = new Notification();

    newNotification.title = 'Multi-Raters Survey Completed';
    newNotification.text = 'One of your multi-raters completed your growth survey.';
    newNotification.url = '/notifications/' + newNotification._id;
    newNotification.notifierId = userRaterId;
    newNotification.read = false;
    newNotification.todoNotification = false;
    newNotification.type = {
      initiatorId: user._id,
      notifierId: userRaterId,
      typeId: '#',
      notificationType: 'Multi-Raters-Take-Survey-Thank-You-Initiator'
    };

    newNotification.save(function (err, notification) {
      console.log('Notification Placed successfully -> ' + notification._id);
      serverEmitter.emit('newNotification', notification);
    });

    var newNotification = new Notification();

    newNotification.title = 'Multi-Raters Survey Completed';
    newNotification.text = 'Thank you for completing multi-raters growth survey.';
    newNotification.url = '/notifications/' + newNotification._id;
    newNotification.notifierId = userRaterId;
    newNotification.read = false;
    newNotification.todoNotification = false;
    newNotification.type = {
      initiatorId: user._id,
      notifierId: userRaterId,
      typeId: '#',
      notificationType: 'Multi-Raters-Take-Survey-Thank-You'
    };

    newNotification.save(function (err, notification) {
      console.log('Notification Placed successfully -> ' + notification._id);
      serverEmitter.emit('newNotification', notification);
    });

    User.findById(userRaterId, function (err, userRater) {
      Notification.find({notifierId: user._id, 'type.initiatorId': userRater._id, 'type.notificationType': 'Multi-Raters-Take-Survey'}, function(err, notifications){
        notifications.forEach(function(notification){
          notification.readNotification();
          notification.save();
        })
      });
    });
  };

  notificationSchema.statics.shareSurveyWithManagerForEditing = function shareSurveyWithManagerForEditing(surveyId, user) {
    var Notification = mongoose.model('Notification');
    var Survey = mongoose.model('Survey');

    Survey.findOne({_id: surveyId}, function (err, survey) {
      var newNotification = new Notification();

      for(var i=0; i<survey.assignManager.length; i++) {
        newNotification.title = 'Survey for Modification';
        newNotification.text = 'Request to check/modify skills in survey.';
        newNotification.url = '/notifications/' + newNotification._id;
        newNotification.notifierId = survey.assignManager[i];
        newNotification.read = false;
        newNotification.todoNotification = true;
        newNotification.type = {
          initiatorId: user._id,
          notifierId: survey.assignManager[i],
          typeId: '/admin',
          notificationType: 'Survey-for-Modification'
        };

        newNotification.save(function (err, notification) {
          console.log('Notification Placed successfully -> ' + notification._id);
          serverEmitter.emit('newNotification', notification);
        });
      }
    });
  };

  notificationSchema.statics.goalFeedback = function goalFeedback(user, growthplanItemId) {
    var Notification = mongoose.model('Notification');
    var GrowthplanItem = mongoose.model('GrowthplanItem');
    console.log(growthplanItemId);
    GrowthplanItem.findOne({_id: growthplanItemId}, function (err, growthplanItem) {
      var newNotification = new Notification();

      newNotification.title = 'Feedback on Goal';
      newNotification.text = 'Feedback received on your goal';
      newNotification.url = '/notifications/' + newNotification._id;
      newNotification.notifierId = growthplanItem.user_id;
      newNotification.read = false;
      newNotification.todoNotification = false;
      newNotification.type = {
        initiatorId: user._id,
        notifierId: growthplanItem.user_id,
        typeId: '#',
        notificationType: 'Goal-Feedback'
      };

      newNotification.save(function (err, notification) {
        console.log('Notification Placed successfully -> ' + notification._id);
        serverEmitter.emit('newNotification', notification);
      });
    });
  };

  return mongoose.model('Notification', notificationSchema);
};

