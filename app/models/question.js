'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var fields = {
  title: {type: String},
  hint: {type: String},
  small_title: {type: String},
  options: [],
  not_able_to_judgement: {
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

var questionSchema = new Schema(fields);

module.exports = mongoose.model('Question', questionSchema);
