'use strict';

var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

var fields = {
	growthplan_item_id: {
		type: Schema.Types.ObjectId,
		ref: 'GrowthplanItem'
	},
	feedback: {
	    type: String
	},
	user_id: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	created_at: { type: Date , default: Date.now },
	updated_at: { type: Date , default: Date.now }
};

var growthplanItemFeedbackSchema = new Schema(fields);

module.exports = mongoose.model('GrowthplanItemFeedback', growthplanItemFeedbackSchema);
