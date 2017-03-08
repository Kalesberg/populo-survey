'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var fields = {
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question'
  },
  submission: {
    type: Schema.Types.ObjectId,
    ref: 'Submission'
  },
  selectedOption: {
    type: Number,
    default: 0
  },
  selectedEmotion: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
};

var answerSchema = new Schema(fields);

module.exports = mongoose.model('Answer', answerSchema);
