'use strict';
var User = require('../models/user');
var Message = require('../models/message');
var Conversation = require('../models/conversation');
var mongoose = require('mongoose');
var Logger = require('winston');

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
    var that = this;
    Logger.info("newConversation userids=", params.user_ids);
    User.find({_id: {$in: params.user_ids}}, function (err, users) {
      var displayNameDefault = [];
      for (var i = 0; i < users.length; i++) {
        displayNameDefault.push(users[i].displayName || users[i].username);
      }
      var conversation = Conversation.create(that.currentUser, params.user_ids, displayNameDefault.join(','));
      conversation.save(function (err) {
        if (!err) {
          Logger.info("newConversation saved", conversation.toPublicJSON());
          cb && cb(conversation.toPublicJSON());
        } else {
          Logger.error('newConversation error', err)
        }
      });
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
      Logger.info("sendTextMessage save ", err);
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