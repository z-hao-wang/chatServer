'use strict';
var mongoose = require('mongoose');
var Logger = require('winston');

var Schema = mongoose.Schema;

var ConversationSchema = new Schema({
  created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
  members: { type: Array, required: true },
  last_message_id: { type: mongoose.Schema.Types.ObjectId, required: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: false }
});

/**
 * @param user {Object} UserSchema object
 * @param member_ids {array} array of mongodb ids
 * @returns {MessageSchema.statics}
 */
ConversationSchema.statics.create = function (user, member_ids) {
  var params = {
    created_by: [user._id],
    members: member_ids
  };
  return new this(params);
};

ConversationSchema.statics.create = function (user) {
  var params = {
    created_by: [user._id],
    members: [user._id]
  };
  return new this(params);
};

module.exports = mongoose.model('Conversation', ConversationSchema);