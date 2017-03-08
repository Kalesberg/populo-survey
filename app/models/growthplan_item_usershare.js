'use strict';

var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

var fields = {
	growthplan_item_id: {
		type: Schema.Types.ObjectId,
		ref: 'GrowthplanItem'
	},
	user_id: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	created_at: { type: Date , default: Date.now },
	updated_at: { type: Date , default: Date.now }
};

var growthplanItemUserShareSchema = new Schema(fields);

module.exports = mongoose.model('GrowthplanItemUserShare', growthplanItemUserShareSchema);
