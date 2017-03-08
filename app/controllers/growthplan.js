var express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Growthplan = mongoose.model('Growthplan'),
    GrowthplanItem = mongoose.model('GrowthplanItem'),
    GrowthplanItemUserShare = mongoose.model('GrowthplanItemUserShare'),
    GrowthplanItemFeedback = mongoose.model('GrowthplanItemFeedback'),
    GrowthplanItemHistory = mongoose.model('GrowthplanItemHistory'),
    Notification = mongoose.model('Notification');
    _ = require('underscore'),
    helper = require('../../config/helper.js');
    extend = require('util')._extend;

module.exports = function (app) {
  // app.get('/growth-plan',
  //     helper.isLoggedIn,
  //     function (req, res) {
  //       var user = req.user;
  //       GrowthplanItem.find({type: 'Organizational', status: 'In progress', parent_growth_plan_id: null, user_id: {$ne: user._id}}, function (err, orgGoalList) {
  //         res.render('growth-plan/growth-plan', {user: user, orgGoalList: orgGoalList});
  //       });
  //   });

  app.get('/goals',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var isAjax = false;
        var datefrom = dateto = '';
        var filter = {$gt: new Date("Jan 1, 1970")};
        if(req.query.isAjax) {
          isAjax = req.query.isAjax;
          datefrom = decodeURI(req.query.from);
          dateto = decodeURI(req.query.to);
          console.log(datefrom,dateto);
        }
        if(datefrom && dateto)
          filter = {$gt: new Date(datefrom), $lt: new Date(dateto)};
        else if(datefrom)
          filter = {$gt: new Date(datefrom)};
        else if(dateto)
          filter = {$lt: new Date(dateto)};

        console.log('isAjax : ' + JSON.stringify(req.body));
        GrowthplanItem.find({user_id: user._id, isArchieve: false, expiry_date: filter}).populate('user_id').exec(function (err, growthPlan) {
          growthPlanItems = [];
          if(growthPlan)
            growthPlanItems = growthPlan 
          else
            Growthplan.setup(user);
          
          GrowthplanItemUserShare.find({user_id: user._id}).populate({path: 'growthplan_item_id', populate: {path: 'growthplan_id'}}).exec(function(err, growthPlanItemUserShares) {
            // _.each(growthPlanItemUserShares, function(growthPlanItemUserShare){
            //   var obj = growthPlanItemUserShare.growthplan_item_id.toObject();
            //   obj.isShare = 1;
            //   growthPlanItems.push(obj);
            // }); 

            //console.log(growthPlanItems);

            modifiedGrowthPlanItems = [];
            var growthPlanItemCount = growthPlanItems.length;
            var tempCount = 0;

            // ***
            if(req.tempCount && req.top_growth_plan_id != modifiedGrowthPlanItems['top_growth_plan_id'] && req.top_growth_plan_id != modifiedGrowthPlanItems['top_growth_plan_id']) {
              var obj = growthPlanItemUserShare.growthplan_item_id.toObject();
              obj.isParent = 1;
              modifiedGrowthPlanItems.push(parentGrowthPlanItem);
              obj.GP = modifiedGrowthPlanItems;
              returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems);
            }

            if(growthPlanItemCount == 0) {
              returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems, isAjax);
            }

            _.each(growthPlanItems, function(objGrowthPlanItem){

              var growthPlanItem = objGrowthPlanItem.toObject();
              //console.log(growthPlanItem);
              growthPlanItem.childDetails = [];
              growthPlanItem.isMine = 1;
              growthPlanItem.userId = user._id;
              growthPlanItem.userName = objGrowthPlanItem.get_user_name(); // objGrowthPlanItem.user_id.full_legal_name; //
              growthPlanItem.status = objGrowthPlanItem.get_status();    
              growthPlanItem.created_at = objGrowthPlanItem.create_date_format();
              growthPlanItem.expiry_date = objGrowthPlanItem.expiry_date_format();  
              growthPlanItem.progress = objGrowthPlanItem.get_progress();
              growthPlanItem.overdue = objGrowthPlanItem.compare_dates();

              if(growthPlanItem.type == 'Organizational' && (!growthPlanItem.parent_growth_plan_id || growthPlanItem.parent_growth_plan_id == ''))
                growthPlanItem.top_growth_plan_id = objGrowthPlanItem._id;

              // ***
              if(req.tempCount && req.top_growth_plan_id != modifiedGrowthPlanItems['top_growth_plan_id'] && req.top_growth_plan_id != modifiedGrowthPlanItems['top_growth_plan_id']) {
                _.each(growthPlanItems, function(objGrowthPlanItem){
                  var obj = growthPlanItemUserShare.growthplan_item_id.toObject();
                  obj.isParent = 1;
                  User.find({manager_id: user.employee_id}, function (err, subordinateUserList) {
                    var arrSubUserId = [];
                    arrSubUserId.push(user._id);
                    arrChild = [];
                    if(subordinateUserList.length > 0) {
                      _.each(subordinateUserList, function(oSubordinateUser) {
                        arrSubUserId.push(oSubordinateUser._id);
                      });
                    }
                    GrowthplanItem.find({type: 'Organizational', top_growth_plan_id: growthPlanItem.top_growth_plan_id, user_id: {$in: arrSubUserId}, _id: {$ne: growthPlanItem._id}}, function (err, subordinateGoals) {
                      parentGrowthPlanItem = subordinateGoals.toObject();
                      parentGrowthPlanItem.childDetails = [];
                      parentGrowthPlanItem.childDetails.push(growthPlanItem);
                      parentGrowthPlanItem.isMine = 0;
                      parentGrowthPlanItem.created_at = objParentGrowthPlanItem.create_date_format();
                      parentGrowthPlanItem.userName = objParentGrowthPlanItem.get_user_name();
                      parentGrowthPlanItem.progress = objParentGrowthPlanItem.get_progress();
                    });

                    var newGPI = _.filter(modifiedGrowthPlanItems, function(modifiedGrowthPlanItem){
                      // console.log(modifiedGrowthPlanItem._id);
                      return !(_.includes(arrChild, modifiedGrowthPlanItem._id.toString()));
                    });

                    // console.log(newModifiedGrowthPlanItems);

                    newGPI.sort(function (a, b) {
                        return b.expiry_date - a.expiry_date;
                    });

                    User.find({$or: [{role: 'Leader'}, {role: 'HR Manager'}]}, function (err, users) {
                      _.each(users, function (user_hr) {
                        var growthplanItemUserShare = new GrowthplanItemUserShare();
                        growthplanItemUserShare.growthplan_item_id = newItem._id;
                        growthplanItemUserShare.user_id = user_hr._id;
                        growthplanItemUserShare.save();
                      });
                    })
                    
                    User.findOne({employee_id: user.manager_id}, function (err, user) {
                      var growthplanItemUserShare = new GrowthplanItemUserShare();
                      growthplanItemUserShare.growthplan_item_id = newItem._id;
                      growthplanItemUserShare.user_id = user._id;
                      growthplanItemUserShare.save();
                    });

                    _.each(modifiedGrowthPlanItems, function(modifiedGrowthPlanItem) {
                      // console.log(modifiedGrowthPlanItem);
                      if (!_.includes(arrChild, modifiedGrowthPlanItem._id.toString())) {
                        var arr = modifiedGrowthPlanItem.childDetails;
                        for(var i = 0; i < arr.length; i++) {
                          arrChild.push(arr[i]._id.toString());
                          arrChild.push(growthplanItemUserShare);
                        }
                      }
                    });

                  });

                  modifiedGrowthPlanItems.push(parentGrowthPlanItem);
                  obj.GP = modifiedGrowthPlanItems;
                  returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems);
                });
              }
              
              if(growthPlanItem.type == 'Personal') {
                modifiedGrowthPlanItems.push(growthPlanItem);
                returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems, isAjax);
              } else {
                User.find({manager_id: user.employee_id}, function (err, subordinateUserList) {
                  var arrSubUserId = [];
                  arrSubUserId.push(user._id);
                  if(subordinateUserList.length > 0) {
                    _.each(subordinateUserList, function(oSubordinateUser) {
                      arrSubUserId.push(oSubordinateUser._id);
                    });
                  }
                  //GrowthplanItem.find({type: 'Organizational', top_growth_plan_id: growthPlanItem.top_growth_plan_id, user_id: {$in: arrSubUserId}, _id: {$ne: growthPlanItem._id}}, function (err, subordinateGoals) {
                    GrowthplanItem.find({type: 'Organizational', parent_growth_plan_id: growthPlanItem._id}).populate('user_id').exec(function (err, subordinateGoals) {
                    // console.log(subordinateGoals);
                    _.each(subordinateGoals, function(objChildGrowthPlanItem) {
                      //if(objChildGrowthPlanItem.user_id.toString() != user._id.toString() || (objChildGrowthPlanItem.user_id.toString() == user._id && objChildGrowthPlanItem.parent_growth_plan_id.toString() == growthPlanItem._id.toString())) {
                        var childGrowthPlanItem = objChildGrowthPlanItem.toObject();
                        childGrowthPlanItem.created_at = objChildGrowthPlanItem.create_date_format();
                        childGrowthPlanItem.expiry_date = objChildGrowthPlanItem.expiry_date_format();  
                        childGrowthPlanItem.userName = objChildGrowthPlanItem.get_user_name();
                        childGrowthPlanItem.status = objChildGrowthPlanItem.get_status();  
                        childGrowthPlanItem.progress = objChildGrowthPlanItem.get_progress();
                        childGrowthPlanItem.overdue = objChildGrowthPlanItem.compare_dates();  
                        childGrowthPlanItem.isMine = 0;
                        growthPlanItem.childDetails.push(childGrowthPlanItem);
                      //}
                    });

                    growthPlanItem.childDetails.sort(function (a, b) {
                        return b.expiry_date - a.expiry_date;
                    });

                    modifiedGrowthPlanItems.push(growthPlanItem);
                    returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems, isAjax);
                  });
                });
              }

              // if(growthPlanItem.type == 'Organizational' && (!growthPlanItem.parent_growth_plan_id || growthPlanItem.parent_growth_plan_id == '')) {
              //   GrowthplanItem.find({parent_growth_plan_id: growthPlanItem._id}, function (err, childGrowthPlanItems) {
              //     _.each(childGrowthPlanItems, function(objChildGrowthPlanItem) {
              //       var childGrowthPlanItem = objChildGrowthPlanItem.toObject();
              //       childGrowthPlanItem.created_at = objChildGrowthPlanItem.create_date_format();
              //       childGrowthPlanItem.userName = objChildGrowthPlanItem.get_user_name();
              //       childGrowthPlanItem.progress = objChildGrowthPlanItem.get_progress();
              //       childGrowthPlanItem.isMine = 0;
              //       growthPlanItem.childDetails.push(childGrowthPlanItem);
              //     });
              //     modifiedGrowthPlanItems.push(growthPlanItem);
              //     returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems);
              //   });
              // }
              // else if(growthPlanItem.type == 'Organizational' && growthPlanItem.parent_growth_plan_id != '') {
              //   // Get parent goal details and append into growthPlanItem
              //   GrowthplanItem.findOne({_id: growthPlanItem.parent_growth_plan_id}, function (err, objParentGrowthPlanItem) {
              //     parentGrowthPlanItem = objParentGrowthPlanItem.toObject();
              //     parentGrowthPlanItem.childDetails = [];
              //     parentGrowthPlanItem.childDetails.push(growthPlanItem);
              //     parentGrowthPlanItem.isMine = 0;
              //     parentGrowthPlanItem.created_at = objParentGrowthPlanItem.create_date_format();
              //     parentGrowthPlanItem.userName = objParentGrowthPlanItem.get_user_name();
              //     parentGrowthPlanItem.progress = objParentGrowthPlanItem.get_progress();

              //     //growthPlanItem.parentDetails = parentGrowthPlanItem;
              //     //modifiedGrowthPlanItems.push(growthPlanItem);
              //     modifiedGrowthPlanItems.push(parentGrowthPlanItem);
              //     returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems);
              //   });
              // } 
              // else {
              //   modifiedGrowthPlanItems.push(growthPlanItem);
              //   returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems);
              // }
            });
          });
        });
      });

  app.post('/goal/:id',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var growthPlanItemId = req.params.id;

        GrowthplanItem.findOne({id: growthPlanItemId}).populate('user_id').exec(function (err, growthPlanItem) {
          
          //console.log(growthPlanItem);
          growthPlanItem.childDetails = [];
          growthPlanItem.isMine = 1;
          growthPlanItem.userId = user._id;
          growthPlanItem.userName = growthPlanItem.get_user_name();
          growthPlanItem.status = growthPlanItem.get_status();    
          growthPlanItem.created_at = growthPlanItem.create_date_format();
          growthPlanItem.expiry_date = growthPlanItem.expiry_date_format();  
          growthPlanItem.progress = growthPlanItem.get_progress();

          if(growthPlanItem.type == 'Organizational' && (!growthPlanItem.parent_growth_plan_id || growthPlanItem.parent_growth_plan_id == ''))
            growthPlanItem.top_growth_plan_id = growthPlanItem._id;
          
          // ***
          if(req.tempCount && req.top_growth_plan_id != modifiedGrowthPlanItems['top_growth_plan_id'] && req.top_growth_plan_id != modifiedGrowthPlanItems['top_growth_plan_id']) {
            _.each(growthPlanItems, function(objGrowthPlanItem){
              var obj = growthPlanItemUserShare.growthplan_item_id.toObject();
              obj.isParent = 1;
              User.find({manager_id: user.employee_id}, function (err, subordinateUserList) {
                var arrSubUserId = [];
                arrSubUserId.push(user._id);
                arrChild = [];
                if(subordinateUserList.length > 0) {
                  _.each(subordinateUserList, function(oSubordinateUser) {
                    arrSubUserId.push(oSubordinateUser._id);
                  });
                }
                GrowthplanItem.find({type: 'Organizational', top_growth_plan_id: growthPlanItem.top_growth_plan_id, user_id: {$in: arrSubUserId}, _id: {$ne: growthPlanItem._id}}, function (err, subordinateGoals) {
                  parentGrowthPlanItem = subordinateGoals.toObject();
                  parentGrowthPlanItem.childDetails = [];
                  parentGrowthPlanItem.childDetails.push(growthPlanItem);
                  parentGrowthPlanItem.isMine = 0;
                  parentGrowthPlanItem.created_at = objParentGrowthPlanItem.create_date_format();
                  parentGrowthPlanItem.userName = objParentGrowthPlanItem.get_user_name();
                  parentGrowthPlanItem.progress = objParentGrowthPlanItem.get_progress();
                });

                var newGPI = _.filter(modifiedGrowthPlanItems, function(modifiedGrowthPlanItem){
                  // console.log(modifiedGrowthPlanItem._id);
                  return !(_.includes(arrChild, modifiedGrowthPlanItem._id.toString()));
                });

                // console.log(newModifiedGrowthPlanItems);

                newGPI.sort(function (a, b) {
                    return b.expiry_date - a.expiry_date;
                });

                User.find({$or: [{role: 'Leader'}, {role: 'HR Manager'}]}, function (err, users) {
                  _.each(users, function (user_hr) {
                    var growthplanItemUserShare = new GrowthplanItemUserShare();
                    growthplanItemUserShare.growthplan_item_id = newItem._id;
                    growthplanItemUserShare.user_id = user_hr._id;
                    growthplanItemUserShare.save();
                  });
                })
                
                User.findOne({employee_id: user.manager_id}, function (err, user) {
                  var growthplanItemUserShare = new GrowthplanItemUserShare();
                  growthplanItemUserShare.growthplan_item_id = newItem._id;
                  growthplanItemUserShare.user_id = user._id;
                  growthplanItemUserShare.save();
                });

                _.each(modifiedGrowthPlanItems, function(modifiedGrowthPlanItem) {
                  // console.log(modifiedGrowthPlanItem);
                  if (!_.includes(arrChild, modifiedGrowthPlanItem._id.toString())) {
                    var arr = modifiedGrowthPlanItem.childDetails;
                    for(var i = 0; i < arr.length; i++) {
                      arrChild.push(arr[i]._id.toString());
                      arrChild.push(growthplanItemUserShare);
                    }
                  }
                });

              });

              modifiedGrowthPlanItems.push(parentGrowthPlanItem);
              obj.GP = modifiedGrowthPlanItems;
              returnGoals(res, user, growthPlanItemCount, modifiedGrowthPlanItems.length, modifiedGrowthPlanItems);
            });
          }

          if(growthPlanItem.type == 'Personal') {
            res.json({status: 'success', item: growthPlanItem}); 
          } else {
            User.find({manager_id: user.employee_id}, function (err, subordinateUserList) {
              var arrSubUserId = [];
              arrSubUserId.push(user._id);
              if(subordinateUserList.length > 0) {
                _.each(subordinateUserList, function(oSubordinateUser) {
                  arrSubUserId.push(oSubordinateUser._id);
                });
              }
              //GrowthplanItem.find({type: 'Organizational', top_growth_plan_id: growthPlanItem.top_growth_plan_id, user_id: {$in: arrSubUserId}, _id: {$ne: growthPlanItem._id}}, function (err, subordinateGoals) {
                GrowthplanItem.find({type: 'Organizational', parent_growth_plan_id: growthPlanItem._id}).populate('user_id').exec(function (err, subordinateGoals) {
                // console.log(subordinateGoals);
                _.each(subordinateGoals, function(objChildGrowthPlanItem) {                 //if(objChildGrowthPlanItem.user_id.toString() != user._id.toString() || (objChildGrowthPlanItem.user_id.toString() == user._id && objChildGrowthPlanItem.parent_growth_plan_id.toString() == growthPlanItem._id.toString())) {
                    var childGrowthPlanItem = objChildGrowthPlanItem.toObject();
                    childGrowthPlanItem.created_at = objChildGrowthPlanItem.create_date_format();
                    childGrowthPlanItem.expiry_date = objChildGrowthPlanItem.expiry_date_format();  
                    childGrowthPlanItem.userName = objChildGrowthPlanItem.get_user_name();
                    childGrowthPlanItem.status = objChildGrowthPlanItem.get_status();  
                    childGrowthPlanItem.progress = objChildGrowthPlanItem.get_progress();
                    childGrowthPlanItem.isMine = 0;
                    growthPlanItem.childDetails.push(childGrowthPlanItem);
                  //}
                });

                growthPlanItem.childDetails.sort(function (a, b) {
                    return b.expiry_date - a.expiry_date;
                });

                res.json({status: 'success', item: growthPlanItem}); 
              });
            });
          }
        });
      });

  app.get('/growth-plan/:id',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var growthPlanItemId = req.params.id;

        GrowthplanItem.findOne({_id: growthPlanItemId}, function (err, growthPlanItem) {
          GrowthplanItem.find({type: 'Organizational'}, function (err, orgGoalList) {
            res.json({status: 'success', data: JSON.stringify(growthPlanItem), parentGoalList: JSON.stringify(orgGoalList)});
          });
        });
      });

  app.get('/parent-growth-plan',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;

        GrowthplanItem.find({type: 'Organizational'}, function (err, orgGoalList) {
          res.json({status: 'success', parentGoalList: orgGoalList});
        });
      });

  app.post('/addGrowthPlanItem',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var data = req.body;
        var top_growth_plan_id = null; 

        GrowthplanItem.findOne({_id: data.goal_contribution}, function (err, topGrowthPlanItem) {
          if(data.goal_contribution != 'new') {
            if(topGrowthPlanItem.parent_growth_plan_id == null)
              top_growth_plan_id = topGrowthPlanItem._id;
            else
              top_growth_plan_id = topGrowthPlanItem.top_growth_plan_id;
          }

          // console.log(top_growth_plan_id);

          Growthplan.findOne({user_id: user._id}, function (err, growthPlan) {

            var newItem = new GrowthplanItem();
            newItem.goal = data.goal;
            newItem.status = data.goal_status;
            newItem.growthplan_id = growthPlan._id;
            newItem.type = data.goal_type;
            newItem.parent_growth_plan_id = (data.goal_contribution == 'new') ? null : data.goal_contribution;
            newItem.comments = data.goal_comments;
            newItem.expiry_date = new Date(data.goal_date);
            newItem.isStratch = data.goal_isStratch;
            newItem.user_id = data.goal_assignee == "no_assignee" ? user._id : data.goal_assignee;
            newItem.owner_id = user._id;
            newItem.top_growth_plan_id = top_growth_plan_id; 

            newItem.save(function (err, newItem) {
              growthPlan.items.push(newItem._id);

              // Supervisory body and Management body
              // User.find({$or: [{role: 'Leader'}, {role: 'HR Manager'}]}, function (err, users) {
              //   _.each(users, function (user_hr) {
              //     var growthplanItemUserShare = new GrowthplanItemUserShare();
              //     growthplanItemUserShare.growthplan_item_id = newItem._id;
              //     growthplanItemUserShare.user_id = user_hr._id;
              //     growthplanItemUserShare.save();
              //   });
              // })
              
              // My Manager 
              // User.findOne({employee_id: user.manager_id}, function (err, user) {
              //   var growthplanItemUserShare = new GrowthplanItemUserShare();
              //   growthplanItemUserShare.growthplan_item_id = newItem._id;
              //   growthplanItemUserShare.user_id = user._id;
              //   growthplanItemUserShare.save();
              // });

              // My Selected Users            
              // TODO:

              growthPlan.save(function (err, doc) {
                if (err) {
                  res.headers({status: 422});
                  res.json({status: 'failure', msg: 'Unprocessible entity'});
                } else {
                  // var modifiedGrowthPlanItems = [];
                  // var objGrowthPlanItem = newItem;
                  // var growthPlanItem = objGrowthPlanItem.toObject();
                  
                  // //console.log(growthPlanItem);
                  // growthPlanItem.childDetails = [];
                  // growthPlanItem.isMine = 1;
                  // growthPlanItem.userId = user._id;
                  // growthPlanItem.userName = objGrowthPlanItem.get_user_name();
                  // growthPlanItem.created_at = objGrowthPlanItem.create_date_format();
                  // growthPlanItem.progress = objGrowthPlanItem.get_progress();

                  // if(growthPlanItem.type == 'Organizational' && (!growthPlanItem.parent_growth_plan_id || growthPlanItem.parent_growth_plan_id == '')) {
                  //   GrowthplanItem.find({parent_growth_plan_id: growthPlanItem._id}, function (err, childGrowthPlanItems) {
                  //     _.each(childGrowthPlanItems, function(objChildGrowthPlanItem) {
                  //       var childGrowthPlanItem = objChildGrowthPlanItem.toObject();
                  //       childGrowthPlanItem.created_at = objChildGrowthPlanItem.create_date_format();
                  //       childGrowthPlanItem.userName = objChildGrowthPlanItem.get_user_name();
                  //       childGrowthPlanItem.progress = objChildGrowthPlanItem.get_progress();
                  //       childGrowthPlanItem.isMine = 0;
                  //       growthPlanItem.childDetails.push(childGrowthPlanItem);
                  //     });
                  //     modifiedGrowthPlanItems.push(growthPlanItem);
                  //     res.json({status: 'success', id: newItem._id, items: modifiedGrowthPlanItems});
                  //   });
                  // }
                  // else if(growthPlanItem.type == 'Organizational' && growthPlanItem.parent_growth_plan_id != '') {
                  //   // Get parent goal details and append into growthPlanItem
                  //   GrowthplanItem.findOne({_id: growthPlanItem.parent_growth_plan_id}, function (err, objParentGrowthPlanItem) {
                  //     parentGrowthPlanItem = objParentGrowthPlanItem.toObject();
                  //     parentGrowthPlanItem.childDetails = [];
                  //     parentGrowthPlanItem.childDetails.push(growthPlanItem);
                  //     parentGrowthPlanItem.isMine = 0;
                  //     parentGrowthPlanItem.created_at = objParentGrowthPlanItem.create_date_format();
                  //     parentGrowthPlanItem.userName = objParentGrowthPlanItem.get_user_name();
                  //     parentGrowthPlanItem.progress = objParentGrowthPlanItem.get_progress();

                  //     //growthPlanItem.parentDetails = parentGrowthPlanItem;
                  //     //modifiedGrowthPlanItems.push(growthPlanItem);
                  //     modifiedGrowthPlanItems.push(parentGrowthPlanItem);
                  //     res.json({status: 'success', id: newItem._id, items: modifiedGrowthPlanItems});
                  //   });
                  // } else {
                  //   modifiedGrowthPlanItems.push(growthPlanItem);
                  //   res.json({status: 'success', id: newItem._id, items: modifiedGrowthPlanItems});
                  // }

                  if(newItem.user_id.toString() != user._id.toString()) {
                    res.json({status: 'success', id: newItem._id, isRemoved: true, isParent: false, parentId: null});
                  } else {
                    if(newItem.type == 'Personal' || (!newItem.parent_growth_plan_id || newItem.parent_growth_plan_id == '')) {
                      res.json({status: 'success', id: newItem._id, isRemoved: false, isParent: true, parentId: null});
                    } else {
                      GrowthplanItem.findById({_id: newItem.parent_growth_plan_id}, function (err, oGrowthPlanItem) {
                        if(oGrowthPlanItem.user_id.toString() == user._id.toString() && (oGrowthPlanItem.parent_growth_plan_id == '' || oGrowthPlanItem.parent_growth_plan_id == null)) {
                          res.json({status: 'success', id: newItem._id, isRemoved: false, isParent: false, parentId: newItem.parent_growth_plan_id});
                        } else {
                          GrowthplanItem.findById({_id: oGrowthPlanItem.parent_growth_plan_id}, function (err, oGrowthPlanItem1) {
                            if(oGrowthPlanItem1.user_id.toString() == user._id.toString()) {
                              res.json({status: 'success', id: newItem._id, isRemoved: false, isParent: true, parentId: null});
                            } else {
                              res.json({status: 'success', id: newItem._id, isRemoved: false, isParent: false, parentId: newItem.parent_growth_plan_id});
                            }
                          });
                        }
                        // else
                        //   res.json({status: 'success', id: newItem._id, isRemoved: false, isParent: true, parentId: null});
                      });
                    }
                  }
                  // res.json({status: 'success', id: newItem._id});
                }
              });
            });
          });
        });        
      });

  app.put('/editGrowthPlanItem/:id',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var itemId = req.params.id;
        var data = req.body;
        // console.log(data);
        GrowthplanItem.findById(itemId, function (err, growthplanItem) {
          // console.log(err);
          //console.log(growthplanItemDB); 
          growthplanItemHistoryJson = JSON.stringify(growthplanItem);
          growthplanItem.goal = data.goal;
          growthplanItem.status = data.goal_status;
          growthplanItem.type = data.goal_type;
          growthplanItem.parent_growth_plan_id = (data.goal_contribution == 'new') ? null : (data.goal_contribution == 'current goal') ? growthplanItem.parent_growth_plan_id : data.goal_contribution;
          growthplanItem.comments = data.goal_comments;
          growthplanItem.isStratch = data.goal_isStratch;
          growthplanItem.user_id = data.goal_assignee == "no_assignee" ? user._id : data.goal_assignee;
          growthplanItem.expiry_date = new Date(data.goal_date);
          //growthplanItem.user_id = user._id;
          
          // console.log(growthplanItem.parent_growth_plan_id);
          GrowthplanItem.findById({_id: growthplanItem.parent_growth_plan_id}, function (err, oGrowthPlanItem) {
            // console.log(err);
            // console.log(oGrowthPlanItem);
            if(growthplanItem.parent_growth_plan_id == null) 
              growthplanItem.top_growth_plan_id = null;
            else {
              growthplanItem.top_growth_plan_id = oGrowthPlanItem.top_growth_plan_id == null ? oGrowthPlanItem._id : oGrowthPlanItem.top_growth_plan_id;
            }
            console.log("$$$$$$$$$");
            // console.log(growthplanItem);
            growthplanItem.save(function (err, item) {
              // console.log(err);
              if (err) {
                //res.headers({status: 422});
                res.json({status: 'failure', msg: 'Unprocessible entity'});
              } else {
                // Goal History
                // console.log(growthplanItemHistoryJson);
                oGrowthplanItemHistory = new GrowthplanItemHistory();
                oGrowthplanItemHistory.growthplan_item_id = itemId;
                oGrowthplanItemHistory.jsonGoal = growthplanItemHistoryJson; 
                oGrowthplanItemHistory.save();

                if(growthplanItem.user_id.toString() != user._id.toString()) {
                  res.json({status: 'success', isRemoved: true, isParent: false, parentId: null});
                } else {
                  if(growthplanItem.type == 'Personal' || (!growthplanItem.parent_growth_plan_id || growthplanItem.parent_growth_plan_id == '')) {
                    res.json({status: 'success', isRemoved: false, isParent: true, parentId: null});
                  } else {
                    if(oGrowthPlanItem.user_id.toString() == user._id.toString() && oGrowthPlanItem.top_growth_plan_id == null) 
                      res.json({status: 'success', isRemoved: false, isParent: false, parentId: growthplanItem.parent_growth_plan_id});
                    else
                      res.json({status: 'success', isRemoved: false, isParent: true, parentId: null});  
                  }
                }
              }
            })

          });
        });
      });

  app.post('/addGoalFeedback',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var data = req.body;
        
        var newItem = new GrowthplanItemFeedback();
        newItem.growthplan_item_id = data.goalItemId;
        newItem.feedback = data.feedbackText;
        newItem.user_id = user._id;
        
        // console.log(newItem);

        newItem.save(function (err, newItem) {
          if (err) {
            res.headers({status: 422});
            res.json({status: 'failure', msg: 'Unprocessible entity'});
          } else {
            // console.log(data.goalItemId);
            Notification.goalFeedback(req.user, data.goalItemId);
            res.json({status: 'success', msg: 'Successfully saved'});
          }
        });
      });

  app.post('/archieveGoal',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        var growthPlanItemId = req.body.goal_id;
        isArchive = true;
        changeArchievStatus(growthPlanItemId, isArchive);
        res.json({status: 'success', msg: 'Archive Successfully'});  
      });
};

function changeArchievStatus(growthPlanItemId, status) {
  GrowthplanItem.findOne({_id: growthPlanItemId}, function (err, growthPlanItem) {
    growthPlanItem.isArchieve = status;
    growthPlanItem.archieve_date = new Date();
    growthPlanItem.save();

    GrowthplanItem.find({parent_growth_plan_id: growthPlanItemId}, function (err, growthPlanItems) {
      _.each(growthPlanItems, function(objGrowthPlanItem) {
        objGrowthPlanItem.isArchieve = status;
        objGrowthPlanItem.archieve_date = new Date();
        objGrowthPlanItem.save();
        changeArchievStatus(objGrowthPlanItem._id, status);
      });
    });
  });
}

function returnGoals (res, user, actualCount, processCount, modifiedGrowthPlanItems, isAjax) {
  // console.log('reached');
  if(actualCount == processCount) {
      // console.log(JSON.stringify(modifiedGrowthPlanItems));
      // res.render('growth-plan/growth-plan-ajax', {user: user, items: modifiedGrowthPlanItems});

      var arrChild = [];
      _.each(modifiedGrowthPlanItems, function(modifiedGrowthPlanItem) {
        // console.log(modifiedGrowthPlanItem);
        if (!_.includes(arrChild, modifiedGrowthPlanItem._id.toString())) {
          var arr = modifiedGrowthPlanItem.childDetails;
          for(var i = 0; i < arr.length; i++) {
            arrChild.push(arr[i]._id.toString());
          }
        }
      });

      // console.log(arrChild);

      var newModifiedGrowthPlanItems = _.filter(modifiedGrowthPlanItems, function(modifiedGrowthPlanItem){
        // console.log(modifiedGrowthPlanItem._id);
        return !(_.includes(arrChild, modifiedGrowthPlanItem._id.toString()));
      });

      // console.log(newModifiedGrowthPlanItems);

      newModifiedGrowthPlanItems.sort(function (a, b) {
          return b.expiry_date - a.expiry_date;
      });

      GrowthplanItem.find({type: 'Organizational'}, function (err, orgGoalList) {
        User.find({}, function (errUser, arrUser) {
          if(isAjax)
            //res.json({status: 'success', user: user, items: newModifiedGrowthPlanItems, orgGoalList: orgGoalList, arrUser: arrUser}); 
            res.render('growth-plan/growth-plan-ajax', {user: user, items: newModifiedGrowthPlanItems, orgGoalList: orgGoalList, arrUser: arrUser});
          else
            res.render('growth-plan/growth-plan', {user: user, items: newModifiedGrowthPlanItems, orgGoalList: orgGoalList, arrUser: arrUser});
        })
      });
  }
}