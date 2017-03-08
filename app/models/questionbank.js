'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var fields = {
  questions: [],
  created_at: { type: Date , default: Date.now },
  updated_at: { type: Date , default: Date.now }
};

var questionbankSchema = new Schema(fields);

module.exports = mongoose.model('Questionbank', questionbankSchema);
