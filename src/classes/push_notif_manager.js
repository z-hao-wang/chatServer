'use strict';
var User = require('../models/user');
var Message = require('../models/message');

var apn = require('apn');
var pushNotifPayload = {
  aps: {
    badge: 1,
    sound: 'default',
    alert: 'Hey! you got message'
  }
};
class PushNotifManager {
  constructor() {
    var options = { };
    this.apnConnection = new apn.Connection(options);
  }

  send(notif) {
    var that = this;
    console.log('push notif', notif);
    // find message data
    Message.findOne({_id: notif.message_id}, (err, message) => {
      // Find user device token
      User.findOne({_id: notif.user_id}, function (err, user) {
        if (!err && user) {
          user.deviceTokenIOS.forEach((deviceTokenIOS) => {
            that._sendIOS(deviceTokenIOS, message);
          });
        }
      });
    });
  }

  _sendIOS(deviceTokenIOS, message) {
    console.log('sendIos push notif', deviceTokenIOS, message);
    var myDevice = new apn.Device(deviceTokenIOS);
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 1;
    note.sound = "ping.aiff";
    note.alert = message.text;
    note.payload = {'messageFrom': message.created_by};

    this.apnConnection.pushNotification(note, myDevice);
  }

};
module.exports = new PushNotifManager();