var express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    _ = require('lodash'),
    helper = require('../../config/helper.js');

module.exports = function (app) { 

    app.get('/insights',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        if (user.role == 'Manager')
          res.redirect('/manager-insights');
        else if (user.role == 'HR Manager')
          res.redirect('/hr-insights');
        else  
          res.render('employee/insights', {
            user: req.user
          });
      });
    
    app.get('/looking_ahead',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/looking_ahead', {
          user: req.user
        });
      });
    
    app.get('/analytics',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/analytics', {
          user: req.user
        });
      });
    
    app.get('/social',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/social', {
          user: req.user
        });
      });
    
    app.get('/learning',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/learning', {
          user: req.user
        });
      });
    
    app.get('/ppl_competency',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/ppl_competency', {
          user: req.user
        });
      });
    
    app.get('/coaching_opportunities',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/coaching_opportunities', {
          user: req.user
        });
      });
    
    app.get('/social_newtork_analysis',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/social_newtork_analysis', {
          user: req.user
        });
      });
    
     app.get('/swot',
      helper.isLoggedIn,
      function (req, res) {
        var user = req.user;
        res.render('employee/swot', {
          user: req.user
        });
      });
    
}