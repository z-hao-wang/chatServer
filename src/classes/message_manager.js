'use strict';
var User = require('../models/user');
var Message = require('../models/message');
var Conversation = require('../models/conversation');
var mongoose = require('mongoose');

class MessageManager {
  constructor (currentUser) {
    this.currentUser = currentUser;
  }

  /**
   * Create a new conversation
   * @param params {user_ids: []}
   * @param cb
   */
  newConversation(params, cb) {
    var conversation = Conversation.create(this.currentUser, params.user_ids);
    conversation.save(function (err) {
      if (!err) {
        console.log("new conversation");
        cb && cb(conversation);
      }
    });
  }

  usernameLookUp(params, cb) {
    User.findOne({username: params.username}, function (err, user) {
      if (!err && user) {
        cb && cb(user.toPublicJSON());
      } else {
        cb && cb(null);
      }
    });
  }

  /**
   * @param params {toUsername: {string}, text: {string}}
   * @param cb
   */
  sendTextMessage(params, cb) {
    // TODO: Message validation: Cannot send to yourself, cannot send empty message
    var msg = Message.createTextMessage({
      from: this.currentUser,
      toUsername: params.toUsername,
      text: params.text
    });
    msg.save(function (err, product, numAffected) {
      console.log("sendTextMessage save ", err);
      if (!err) {
        cb && cb(msg);
      }
    });
  }

  doAction (action, data, cb) {
    if (this[action]) {
      this[action](data, cb);
    }
  }
}

module.exports = MessageManager;