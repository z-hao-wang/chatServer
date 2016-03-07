'use strict';
var User = require('../models/user');
var Message = require('../models/message');
var Conversation = require('../models/conversation');
var Notif = require('../models/notif');
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
          Logger.error('newConversation error', err);
        }
      });
    });
  }

  /**
   * return new conversations data
   * @param params
   * @param cb
   */
  getConversations(params, cb) {
    Conversation.find({_id: {$in: params.conversation_ids}}, (err, conversations) => {
      if (!err) {
        cb && cb(conversations.map((c) => {return c.toPublicJSON()}));
      } else {
        Logger.error("getConversations:err ", err);
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
   * @param params {conversation_id: {string}, text: {string}}
   * @param cb
   */
  sendTextMessage(params, cb) {
    var that = this;
    // TODO: Message validation: Cannot send to yourself, cannot send empty message
    Conversation.findOne({_id: mongoose.Types.ObjectId(params.conversation_id.toString())}, (err, conversation) => {
      // get conversation data
      // find all recipients (except current user)
      var recipients = conversation.members.filter((id) => { return id != that.currentUser._id;});
      var msg = Message.createTextMessage({
        from: this.currentUser,
        conversation_id: params.conversation_id,
        recipients: recipients,
        text: params.text
      });
      msg.save(function (err, product, numAffected) {
        Logger.info("sendTextMessage save ", err);
        // TODO: send push notifs to all recipients
        if (!err) {
          Logger.info('sendTextMessage', msg.toPublicJSON());
          cb && cb(msg.toPublicJSON());
          // Save this message to Notif
          recipients.forEach((user_id) => {
            Notif.create({
              user_id: user_id,
              message_id: msg._id
            }).save();
          });
        } else {
          cb && cb(null);
        }
      });
    });
  }

  getNewMessages(params, cb) {
    // first find all notifs
    Notif.find({user_id: this.currentUser._id}, (err, notifs) => {
      if (err) {
        Logger.error('getNewMessages:Notif.find:error', err);
        return;
      }
      // notifs is an array containing {_id: objectId, user_id: objectId, message_id: objectId}
      // find details of each message_id
      var messageIds = notifs.map((n) => {return n.message_id});
      Message.find({_id: {$in: messageIds}}, (err, messages) => {
        if (err) {
          Logger.error('getNewMessages:Message.find:error', err);
          return;
        } else {
          var ret = messages.map((n) => {return n.toPublicJSON()});
          console.log('getNewMessages:messages', ret);
          cb && cb(ret);
        }
      });
    });
  }

  acknowledgeNewMessages(params, cb) {
    console.log('acknowledgeNewMessages: ', params);
    // DELETE those notifs
    Notif.find({
      message_id: {$in: params.message_ids}
    }, function (err, docs) {
      docs.forEach((doc) => {
        doc.remove();
      });
    });
  }

  doAction (action, data, cb) {
    if (this[action]) {
      this[action](data, cb);
    }
  }
}

module.exports = MessageManager;