'use strict';

var mongoose = require('mongoose'),
    _ = require('underscore'),
    Schema = mongoose.Schema;

var fields = {
  user: {
    type: Object
  },
  status: {
    type: String,
    enum: ['on', 'off']
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

var selectedRatersSchema = new Schema(fields);
module.exports = mongoose.model('SelectedRaters', selectedRatersSchema);