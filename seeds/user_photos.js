var appEnvironment = process.env.NODE_ENV || 'development';
var express = require('express'),
    config = require('../config/config.js')(appEnvironment),
    glob = require('glob'),
    _ = require('underscore'),
    fs = require('fs'),
    xml2js = require('xml2js'),
    base64 = require('node-base64-image'),
    mongoose = require('mongoose');
    events = require('events'),
    serverEmitter = new events.EventEmitter();

//Loading constants
require(config.root + '/config/constants');

//Loading Models
var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model)(serverEmitter);
});

//MongoDB Connection
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var generatePhotos = function () {
  var parser = new xml2js.Parser();
  var User = mongoose.model('User');

  fs.readFile(__dirname + '/photos-xml/worker_fotos.xml', function (err, data) {
    parser.parseString(data, function (err, result) {
      var picsData = result['wd:Report_Data']['wd:Report_Entry'];

      picsData.forEach(function(picData){
        if(picData['wd:Photo']){
          var base64Data = picData['wd:Photo'][0]['wd:Base64_Image_Data'][0];
          var name = picData['wd:Name'][0];
          var employeeId = picData['wd:Employee_ID'][0];
          var localFilePath = __dirname + '/../public/avatar/' + name;
          var relativePath = '/files/avatar/' + name + '.jpg';

          User.findOne({employee_id: parseInt(employeeId)}, function(err, user){
            if(user != null){
              var user = user;
              base64.base64decoder(base64Data, {filename: localFilePath}, function (err, image) {
                user.avatar = relativePath;
                user.save(function(err, doc){
                  console.log('Uploaded user pic '+ doc.full_legal_name);
                });
              });
            }
          })
        }
      });
    });
  });
};

generatePhotos();
