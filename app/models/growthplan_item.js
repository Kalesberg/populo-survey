'use strict';

var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

var fields = {
	growthplan_id: {
		type: Schema.Types.ObjectId,
		ref: 'Growthplan'
	},
	user_id: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	owner_id: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	goal: { type: String },
	status: { type: String },
    way_forward: { type: String },
	comments: { type: String },
	type: {
	    type: String,
	    enum: ['Organizational', 'Personal']
	},
	parent_growth_plan_id: {
		type: Schema.Types.ObjectId
	},
	top_growth_plan_id: {
		type: Schema.Types.ObjectId
	},
	isArchieve: { type: Boolean, default: false },
	isStratch: { type: Boolean, default: false },
	archieve_date: { type: Date, default: null},
	on_the_job: { type: String },
	coaching_and_mentoring: { type: String },
	training_and_self_study: { type: String },
	expiry_date: { type: Date , default: Date.now },
	created_at: { type: Date , default: Date.now },
	updated_at: { type: Date , default: Date.now }
};

var growthplanItemSchema = new Schema(fields);

growthplanItemSchema.methods.create_date_format = function create_date_format(){
    var moment = require('moment');
    var _this = this;
    var date = new Date(_this.created_at);
    
    return this.created_at == undefined ? '' : moment(_this.created_at).format('MMM DD, YYYY');
    //  return 
  };

growthplanItemSchema.methods.expiry_date_format = function expiry_date_format(){
    var moment = require('moment');
    var _this = this;
    var expiryDate = new Date(_this.expiry_date);
    
    expiryDate.setHours(23,59,55);
    
    return this.expiry_date == undefined ? '' : moment(_this.expiry_date).endOf('day').format('MMM DD, YYYY');
    //  return 
};

growthplanItemSchema.methods.compare_dates = function compare_dates(){
    
    var _this = this,
        expiryDate = new Date(_this.expiry_date),
        dateNow = new Date(),
        overdue = false;
    
    expiryDate.setHours(0,0,0,0);
    dateNow.setHours(0,0,0,0);
    
    if(expiryDate < dateNow){
        overdue = true;    
    }
    
    return overdue;
    
};

growthplanItemSchema.methods.get_user_name = function get_user_name(){
    var _this = this;
    return _this.user_id.full_legal_name;
    //  return 
  };

growthplanItemSchema.methods.get_status = function get_status(){
    var _this = this;
    
    var status = _this.status;
    
    return status;
    //  return 
  };

growthplanItemSchema.methods.get_progress = function get_progress(){
    var _this = this;
    
    var actual_time = _this.expiry_date - _this.created_at;
    var remaining_time = new Date() - _this.created_at;

    console.log(actual_time);
    console.log(remaining_time);

    return (remaining_time > actual_time) ? 100 : Math.round((remaining_time/actual_time) * 100 * 100) / 100 ;
    //  return 
  };

module.exports = mongoose.model('GrowthplanItem', growthplanItemSchema);
