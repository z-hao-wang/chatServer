'use strict';
var mongoose = require('mongoose');
var Logger = require('winston');

var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String, required: false },
  meta: { type: Object, required: false },
  to_username: { type: String, required: true}, // toUsername
  created_at: { type: Date, required: true, default: Date.now },
  //updated_at: { type: Date } // in the future we may want to add edit message feature
});

/**
 * @param params {from: {User}, to: {User}, text: {String}}
 * @returns {MessageSchema.statics}
 */
MessageSchema.statics.createTextMessage = function (params) {
  var params = {
    created_by: params.from._id,
    text: params.text,
    to_username: params.toUsername,
    meta: {
      type: 'text'
    }
  };
  return new this(params);
};

MessageSchema.statics.toJson = function () {
  var ret = {
    created_by: this._id,
    text: this.text,
    to_username: this.to_username,
    meta: this.meta
  };
  return ret;
};

var Message = mongoose.model('Message', MessageSchema);

module.exports = Message;