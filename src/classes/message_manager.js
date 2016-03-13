'use strict';
var User = require('../models/user');
var Message = require('../models/message');
var Conversation = require('../models/conversation');
var Notif = require('../models/notif');
var mongoose = require('mongoose');
var Logger = require('winston');
var redis = require('redis');
var PushNotifManager = require('./push_notif_manager');

class MessageManager {
  constructor () {
    this.redis = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true});
  }

  /**
   * Create a new conversation
   * @param params {user_ids: []}
   * @param cb
   */
  newConversation(params, cb, currentUser) {
    var that = this;
    Logger.info("newConversation userids=", params.user_ids.join(','));
    User.find({_id: {$in: params.user_ids}}, function (err, users) {
      // Be default, let's give it empty display name
      var conversation = Conversation.create(currentUser, params.user_ids, '');
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
    User.findOne({username: params.username.toLowerCase()}, function (err, user) {
      if (!err && user) {
        cb && cb(user.toPublicJSON());
      } else {
        cb && cb(null);
      }
    });
  }
  
  getUsers(params, cb) {
    Logger.info("getUsers userids=", params.user_ids)
    var userIds = params.user_ids;
    if (userIds.length > 0) {
      User.find({_id: {$in: userIds}}, function (err, users) {
        if (!err) {
          var res = users.map((user) => {return user.toPublicJSON()});
          cb && cb(res);
        } else {
          cb && cb([]);
        }
      });
    } else {
      cb && cb([]);
    }
  }

  /**
   * @param params {conversation_id: {string}, text: {string}}
   * @param cb
   */
  sendTextMessage(params, cb, currentUser) {
    var that = this;
    // TODO: Message validation: Cannot send to yourself, cannot send empty message
    Conversation.findOne({_id: mongoose.Types.ObjectId(params.conversation_id.toString())}, (err, conversation) => {
      // get conversation data
      // find all recipients (except current user)
      var recipients = conversation.members.filter((id) => { return id != currentUser.id; });
      var msg = Message.createTextMessage({
        from: currentUser,
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
            var notif = Notif.create({
              user_id: user_id,
              message_id: msg.id
            });
            // to simplify the process, we are going to try to send a push notif to all these recipients
            // in the future, we want to have a worker to do this in the background.
            PushNotifManager.send(notif);
            notif.save();
          });
          var redisMessage = JSON.stringify({
            recipients: recipients,
            action: 'pushTextMessage',
            data: msg.toPublicJSON()
          });
          that.redis.publish('global', redisMessage);
      } else {
          cb && cb(null);
        }
      });
    });
  }

  getNewMessages(params, cb, currentUser) {
    // first find all notifs
    Notif.find({user_id: currentUser.id}, (err, notifs) => {
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

  doAction (action, data, cb, currentUser) {
    if (this[action]) {
      this[action](data, cb, currentUser);
    }
  }
}

module.exports = MessageManager;