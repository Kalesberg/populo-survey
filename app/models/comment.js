'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var fields = {
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question'
  },
  submission: {
    type: Schema.Types.ObjectId,
    ref: 'Submission'
  },
  answerText: {
    type: String
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

var commentSchema = new Schema(fields);

module.exports = mongoose.model('Comment', commentSchema);
