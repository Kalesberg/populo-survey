'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var fields = {
  userId: {
    type: String
  },
  text: {
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

var insightsSchema = new Schema(fields);

module.exports = mongoose.model('Insights', insightsSchema);
