"use strict"
var jwt = require('jwt-simple');
var User = require('../models/user');
var sha1 = require('sha1');
var moment = require('moment');

class Auth {

  getTokenSecret () {
    return 'Ax34.%6925Ant3;lLsA';
  }

  getPasswdSalt () {
    return 'Ox7U34.%6Cgt3;lLsH9&#ax.yTGplAX5$%dstoi.GwefGERDSterSDFerRTR^$#';
  }

  genToken (username) {
    var expires = moment().add(7, 'days').valueOf();
    var token = jwt.encode({
      iss: username,
      exp: expires
    }, this.getTokenSecret());
    return {
      token: token,
      expires: expires
    }
  }

  decodeToken (token) {
    var decoded = jwt.decode(token, this.getTokenSecret());
    return decoded;
  }

  getUserByToken (token, cb) {
    if (!token) {
      cb({
        err: 1,
        message: "token empty"
      });
    }
    var that = this;
    var decoded = this.decodeToken(token);
    if (decoded.exp > +(new Date())) {
      User.findOne({username: decoded.iss}, function (err, user) {
        if (!user) {
          cb({
            err: 3,
            message: "user not exist"
          }); // error
        } else {
          cb({
            err: err,
            response: {
              token: that.genToken(decoded.iss).token, // renew this token
              user: user.toPublicJSON()
            }
          });
        }
      });
    } else {
      cb({
        err: 2,
        message: "token expired"
      }); // expired
    }
  }

  setDeviceTokenIOS(userId, deviceTokenIOS) {
    console.log('info: setDeviceTokenIOS=' + deviceTokenIOS);
    if (userId && deviceTokenIOS) {
      User.findOne({_id: userId}, function (err, user) {
        // TODO: We will need a way to track how many devices this user use. and only store the latest device token for each device
        // For now we just assume each user has only 1 devicetoken (latest login device)
        user.deviceTokenIOS = [deviceTokenIOS];
        user.save();
      });
    }
  }

  login (data, cb) {
    if ((data.email || data.username) && data.password) {
      var searchObj;
      if (data.username) {
        searchObj = { username: data.username.toLowerCase() };
      } else if (data.email) {
        searchObj = { email: data.email };
      }
      User.findOne(searchObj, function(err, user) {
        if (!user) {
          cb({
            err: 1,
            response: {
              msg: "Username or password mismatch"
            }
          });
        } else {
          // add some salt
          if (sha1(this.getPasswdSalt() + data.password) === user.password) {
            var tokenData = this.genToken(user.username);
            cb({
              err: 0,
              response: {
                token : tokenData.token,
                expires: tokenData.expires,
                user: user.toPublicJSON()
              }
            });
          } else {
            cb({
              err: 2,
              response: {
                msg: "Username or password mismatch"
              }
            });
          }
        }
      }.bind(this));
    } else {
      cb({err: 3});
    }
  }

  userExists (data, cb) {
    if (data.username) {
      User.findOne({ username: data.username.toLowerCase() }, function(err, user) {
        if (!user) {
          cb(0);
        } else {
          cb(1);
        }
      });
    } else {
      cb(0);
    }
  }

  register (data, cb) {
    this.userExists(data, function (exists) {
      if (!exists) {
        // create a new user
        var user = new User({
          username: data.username.toLowerCase(),
          password: sha1(this.getPasswdSalt() + data.password)
        });
        // call the built-in save method to save to the database
        user.save(function(err) {
          if (err) {
            cb({
              err: 2,
              response: {
                msg: "unknown error"
              }
            });
            throw err;
          } else {
            var tokenData = this.genToken(user.email)
            cb({
              err: 0,
              response: {
                token: tokenData.token,
                expires: tokenData.expires,
                user: user.toPublicJSON()
              }
            });
          }

        }.bind(this));
      } else {
        cb({
          err: 1,
          response: {
            msg: "Username Exists"
          }
        });
      }
    }.bind(this));
  }

  logout () {
    // TODO: do something when user logout
  }
}

module.exports = Auth;