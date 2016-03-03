'use strict'
var User = require('../models/user');
var Conversation = require('../models/conversation');
var mongoose = require('mongoose');
var Config = require('../../config/app');
var _ = require('underscore');

class ConversationManager {

  constructor (currentUser) {
    this.currentUser = currentUser;
  }

  doAction (action, data, cb) {
    switch (action) {
      case 'saveRoles':
        break;
      default:
        break;
    }
  }

  /**
   * Return processed data
   * @param user
   * @param cb
   */
  getActiveConversations (user, cb) {
    var that = this;
    this._getActiveConversations(user, function (conversation) {
      if (!conversation) {
        return cb(0);
      }
    });
  }
  createConversation (cb) {

  }

  /**
   *
   * @param data
   * @param cb {function (0|{object})} return conversation schema or 0
   */
  joinConversation (data, cb) {

  }

  quitConversation (cb) {

  }

  /**
   * Process the ret and prepare to return to client
   * @param user object, mongoose schema or plain object
   * @param ret {object}, mongoose schema
   * @returns {{}}
   */
  processConversation (creater, conversation, cb) {
    // need to get all users

  }
}

module.exports = ConversationManager;