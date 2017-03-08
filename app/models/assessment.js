'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('underscore')

//Loading constants
require('../../config/constants');

var fields = {
  tag: {
    type: String
  },
  index: Number, 
  instruction_text: String,
  skill:Boolean,    
  questions: [],
  comment_questions: [],
  created_at: {
    type: Date,
    default: Date.now
  },
  survey: {
    type: Schema.Types.ObjectId,
    ref: 'Survey'
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
};

var assessmentSchema = new Schema(fields);

assessmentSchema.statics.generateSkillAssessment = function generateSkillAssessment(survey, questions){
  var Question = mongoose.model('Question');
  var Assessment = mongoose.model('Assessment');

  var general_comment_questions = ['Please provide comments or examples here. These comments are valuable as they ' +
      'make the feedback more actionable.'];

  var commentsList = _.map(general_comment_questions, function (comment) {
    var newQuestion = new Question();
    newQuestion.title = comment;

    newQuestion.save();
    return newQuestion;
  });

  var skillAssessment = new Assessment();
  skillAssessment.tag = 'SKILLS';
  skillAssessment.survey = survey._id;
  skillAssessment.questions = questions;
  skillAssessment.comment_questions = commentsList;
  skillAssessment.created_at = new Date();
  skillAssessment.updated_at = new Date();
  skillAssessment.save();

  return skillAssessment;
};

module.exports = mongoose.model('Assessment', assessmentSchema);
