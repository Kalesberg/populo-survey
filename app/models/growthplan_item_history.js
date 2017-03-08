'use strict';

var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

var fields = {
	growthplan_item_id: {
		type: Schema.Types.ObjectId,
		ref: 'GrowthplanItem'
	},
	jsonGoal: {
	    type: String
	},
	created_at: { type: Date , default: Date.now },
	updated_at: { type: Date , default: Date.now }
};

var growthplanItemHistorySchema = new Schema(fields);

module.exports = mongoose.model('GrowthplanItemHistory', growthplanItemHistorySchema);
