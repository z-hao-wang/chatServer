'use strict';
var mongoose = require('mongoose');
var Logger = require('winston');

var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String, required: false },
  meta: { type: Object, required: false },
  conversation_id: { type: mongoose.Schema.Types.ObjectId, required: true},
  recipients: { type: Array, required: false }, // Array of user ids
  created_at: { type: Date, required: true, default: Date.now }
  //updated_at: { type: Date } // in the future we may want to add edit message feature
});

/**
 * @param params {from: {User}, conversation_id: {Mongodb id}, text: {String}}
 * @returns {MessageSchema.statics}
 */
MessageSchema.statics.createTextMessage = function (params) {
  var conversationId = mongoose.Types.ObjectId(params.conversation_id.toString());
  var params = {
    created_by: params.from.id,
    text: params.text,
    conversation_id: conversationId,
    recipients: params.recipients,
    meta: {
      type: 'text' //default is text
    }
  };
  return new this(params);
};

MessageSchema.methods.toPublicJSON = function () {
  var ret = {
    id: this._id,
    created_by: this.created_by,
    created_at: this.created_at,
    text: this.text,
    conversation_id: this.conversation_id,
    recipients: this.recipients,
    meta: this.meta
  };
  return ret;
};

module.exports = mongoose.model('Message', MessageSchema);