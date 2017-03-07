var _ = require('underscore'),
    request = require('request'),
    fs = require('fs'),
    rl = require('readline'),
    http = require('http');

require('../config/constants');

var userXlsx = function (file) {

  var formData = {
    userExcel: fs.createReadStream(file)
  };

  request.post(
      {url:'http://localhost:3000/xlsx/users',
        formData: formData,
        headers: {'apiKey': constants.apiKey}},
      function(err, httpResponse, body) {
    if (err) {
      console.error('upload failed:', err);
    }
    console.log('Upload successful!');
  });
};


var inputSelection = function () {
  var prompts = rl.createInterface(process.stdin, process.stdout);

  console.log('1. User Excel imports');
  console.log('2. User Excel Imports with emails');

  prompts.question('Select Any one of the option ? ', function (option) {
    switch (option) {
      case '1':
        var url = './seeds/excels/Populo_Org_Chart.xlsx';
        userXlsx(url);
        break;
      case '2':
        var url = './seeds/excels/users_email.xlsx';
        userXlsx(url);
        break;
      default:
        console.log('invalid option');
    }
    prompts.close();
  });
}();
