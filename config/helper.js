bcrypt = require('bcrypt-nodejs');
var _ = require('underscore');

require('./constants');

var helper = {
  isLoggedIn: function (req, res, next) {
    if (req.isAuthenticated())
      return next();

    res.redirect('/');
  },

  isAPIAuthenticated: function (req, res, next) {
    var requestedApiKey = req.headers.apikey;

    if (requestedApiKey == constants.apiKey)
      return next();

    res.headers({status: 401});
    res.json({status: 'failure', msg: 'Unauthorized access'});
  },

  encryptPassword: function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
  },

  excelImportJSON: function (xlsx, filePath) {
    var userWorkbook = xlsx.readFile(filePath);
    var first_sheet_name = userWorkbook.SheetNames[0];
    var userExcel = userWorkbook.Sheets[first_sheet_name];

    return xlsx.utils.sheet_to_json(userExcel);
  },

  surveyStats: function (surveyId) {
    var Submission = mongoose.model('Submission');
    var Survey = mongoose.model('Survey');

    Survey.findOne({}, function (survey) {
      Submission.find({survey: survey._id}, function (err, submission) {
        console.log(submission)
      })
    });
  },

  getAncestors: function getAncestors(users, selectedUser) {
    console.log('starting of employee ' + selectedUser['Employee_ID']);

    var managerId = selectedUser['Manager_ID'];
    var ancestors = [managerId];

    function selectManager(users, managerId) {
      var user = _.find(users, function (user) {
        return (managerId == user['Employee_ID']);
      });

      if (!(_.isUndefined(user))) {
        managerId = user['Manager_ID'];
        return managerId;
      }else{
        return user;
      }
    }

    console.log('selecting managers');

    while(true){
      managerId = selectManager(users, managerId);

      if(_.isUndefined(managerId)){
        break;
      }else{
        ancestors.push(managerId);
      }
    }

    return ancestors;
  }
};

module.exports = helper;
