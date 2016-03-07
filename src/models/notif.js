'use strict';
var mongoose = require('mongoose');
var Logger = require('winston');

var Schema = mongoose.Schema;

var NotifSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  message_id: { type: String, required: true }
});

/**
 * @param params
 * @returns {MessageSchema.statics}
 */
NotifSchema.statics.create = function (params) {
  var params = {
    message_id: mongoose.Types.ObjectId(params.message_id.toString()),
    user_id: mongoose.Types.ObjectId(params.user_id.toString())
  };
  return new this(params);
};

NotifSchema.methods.toPublicJSON = function () {
  var ret = {
    _id: this._id,
    user_id: this.user_id,
    message_id: this.message_id
  };
  return ret;
};

module.exports = mongoose.model('Notif', NotifSchema);