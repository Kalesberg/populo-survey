'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('lodash'),
    ObjectId = Schema.ObjectId;

var fields = {
  title: { type: String },
  assessments: [],
  manager_assessments: [],
  team_leader_assessments: [],
  selected_dimensions: [],
  question_bank: {
    type: Schema.Types.ObjectId,
    ref: 'Questionbank'
  },
  survey_type: { type: String},
  created_at: { type: Date , default: Date.now },
  updated_at: { type: Date , default: Date.now }
};

var templateSchema = new Schema(fields);

templateSchema.methods.registerQuestions = function registerQuestions(questions){
  var _this = this;
  var Question = mongoose.model('Question');
  var Questionbank = mongoose.model('Questionbank');

  var registerQuestions = _.map(questions, function(question){
    var newQuestion = new Question();

    newQuestion.title = question;
    newQuestion.small_title = question;
    newQuestion.created_at = new Date();
    newQuestion.updated_at = new Date();
    newQuestion.options = constants.skill_question_options;
    newQuestion.save(function(err, doc){
      console.log('Question Added to questions');
    });

    Questionbank.update({_id: _this.question_bank}, {$push: {questions: newQuestion}}, function(err, doc){
      console.log('Question bank updated');
    });

    return newQuestion;
  });

  return registerQuestions;
}

module.exports = mongoose.model('Template', templateSchema);
