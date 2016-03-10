'use strict';
var mongoose = require('mongoose');
var Logger = require('winston');

var Schema = mongoose.Schema;

var ConversationSchema = new Schema({
  created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
  members: { type: Array, required: true },
  displayName: { type: String, required: false },
  last_message_id: { type: mongoose.Schema.Types.ObjectId, required: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: false }
});

/**
 * @param user {Object} UserSchema object
 * @param member_ids {array} array of mongodb ids
 * @returns {MessageSchema.statics}
 */
ConversationSchema.statics.create = function (user, member_ids, displayName) {
  if (member_ids.indexOf(user._id.toString()) == -1) {
    member_ids.push(user._id.toString());
  }
  var params = {
    created_by: [user._id],
    members: member_ids,
    displayName: displayName || ''
  };
  return new this(params);
};

ConversationSchema.methods.toPublicJSON = function () {
  var ret = {
    _id: this._id,
    members: this.members,
    displayName: this.displayName,
    created_by: this.created_by,
    last_message_id: this.last_message_id
  };
  return ret; // TODO: may want to find better ways to convert to plain json object
};

module.exports = mongoose.model('Conversation', ConversationSchema);