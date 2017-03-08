'use strict';

var mongoose = require('mongoose'),
    _ = require('underscore'),
    Schema = mongoose.Schema;

var fields = {
  survey: {
    type: Schema.Types.ObjectId,
    ref: 'Survey'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  managerComments: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected']
  },
  selectedRaters: [],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
};

var surveyRaterSchema = new Schema(fields);
module.exports = mongoose.model('SurveyRaters', surveyRaterSchema);