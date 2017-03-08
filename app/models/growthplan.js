'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var fields = {
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [{type: Schema.ObjectId, ref: 'GrowthplanItem'}], 
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
};

var growthplanSchema = new Schema(fields);

growthplanSchema.statics.setup = function setup(user){
  var growthPlan = new this();
  growthPlan.user_id = user._id;

    growthPlan.save(function(err, doc){
        if(err){
            console.log('Error while saving the growth plan for user: ', user.full_legal_name)
        }else{
            console.log('Created Growth Plan for user: ', user.full_legal_name)
        }
    })
};

module.exports = mongoose.model('Growthplan', growthplanSchema);
