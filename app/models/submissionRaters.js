'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('underscore'),
    _lodash = require('lodash'),
    Question = mongoose.model('Question'),
    Answer = mongoose.model('Answer');

//Loading constants
require('../../config/constants');


var fields = {
  survey: {
    type: Schema.Types.ObjectId,
    ref: 'Survey'
  },
  answers: [],
  comments: [],
  assessment: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment'
  },
  // User who submit the assessment
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Actual user for whom rater going to submit assessment
  userRater: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  state: {
    type: String,
    enum: ['save', 'submit']
  },
  optionsSaved: {
    type: Object
  },
  questionAnswersAggr: {
    type: Object
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  tag: {
    type: String
  }
};

var submissionRatersSchema = new Schema(fields);

submissionRatersSchema.plugin(require('mongoose-lifecycle'));

submissionRatersSchema.methods.getProgress = function getProgress() {
  var tags = constants['tag_names'];
  var progress = ((_.findIndex(tags, this.populate('assessment').tag) + 1) / tags.length) * 100;

  return progress;
};

submissionRatersSchema.methods.processAnswers = function processAnswers() {
  this.optionsSaved = _.map(this.answers, function (answer) {
    var question = answer.populate('question').question;
    return {
      question: question.title,
      question_small: question.small_title,
      selectedOption: answer.selectedOption,
      answerText: question.options[answer.selectedOption],
      selectedNA: answer.selectedEmotion
    }
  });

  this.questionAnswersAggr = this.getQuestionsAndAnswers;
};

submissionRatersSchema.methods.getQuestionsAndAnswers = function getQuestionsAndAnswers() {
  var answeredQuestions = _.filter(this.optionsSaved, function (qa) {
    return !(qa.selectedNA);
  });

  var questions = _.pluck(answeredQuestions, 'question_small');
  var answers = _.pluck(answeredQuestions, 'selectedOption');

  return {"questions": questions, "answers": answers};
};

submissionRatersSchema.statics.updateUserProgress = function updateUserProgress(submission) {
  var Survey = mongoose.model('Survey');

  Survey.findOne({_id: submission.survey}, function (err, survey) {

    var assignedUsers = _.pluck(survey.assignees, 'full_legal_name');

    Submission.find({survey: survey._id}).populate('user').exec(function (err, submissions) {
      var submittedUsers = [];
      var pendingUsers = [];

      _.forEach(submissions, function (submission) {
        if (submission.state == 'submit') {
          submittedUsers.push(submission.user.full_legal_name);
        } else {
          pendingUsers.push(submission.user.full_legal_name);
        }
      });

      var nonSubmittedUsers = _.difference(assignedUsers, _.union(submittedUsers, pendingUsers));


      pendingUsers  = _.filter(pendingUsers, function(user){
        _.contains(submittedUsers, user)
      });

      nonSubmittedUsers = _.map(nonSubmittedUsers, function (user) {
        return {name: user, state: 'Not Started'}
      });

      pendingUsers = _.map(pendingUsers, function (user) {
        return {name: user, state: 'In Progress'}
      });

      pendingUsers = _lodash.uniqBy(pendingUsers, 'name');

      submittedUsers = _.map(submittedUsers, function (user) {
        return {name: user, state: 'Finished'}
      });

      var users = _.flatten([submittedUsers, pendingUsers, nonSubmittedUsers]);

      users = _.map(users, function(user){
        var userSubmissions = _.filter(submissions, function(submission){
          return (submission.full_legal_name == user.name);
        });

        var submissionsCount = userSubmissions.length;

        return {name: user.name, state: user.state, no_of_submissions: submissionsCount}
      });

      survey.userStats = _.sortBy(users, function (user) {
        return user.name.toUpperCase();
      });

      survey.save(function (err, doc) {
        if (!err) {
          console.log('successfully processed user stats');
        }
      })
    });
  })
};

module.exports = mongoose.model('SubmissionRaters', submissionRatersSchema);

//Listeners
var SubmissionRaters = mongoose.model('SubmissionRaters');

SubmissionRaters.on('beforeSave', function (submissionRater) {
  var Survey = mongoose.model('Survey');

  /*Survey.findOne({_id: submissionRater.survey}, function (err, survey) {
    survey.getProgress();
  });*/

  submissionRater.processAnswers();
});

