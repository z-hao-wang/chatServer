'use strict'
var mongoose = require('mongoose');
var Config = require('../../config/app');
var _ = require('underscore');
var Logger = require('winston');

var Schema = mongoose.Schema;

var ConversationSchema = new Schema({
  created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
  admins: { type: Array, required: true},
  users: { type: Array, required: true}, // each user contains an object
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date }
});

ConversationSchema.statics.createConversation = function (user) {
  var params = {
    created_by: user._id
  };
  return new this(params);
};

var Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;