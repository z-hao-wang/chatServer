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
    var decoded = this.decodeToken(token);
    if (decoded.exp > +(new Date())) {
      User.findOne({username: decoded.iss}, function (err, user) {
        cb({
          err: err,
          response: {
            user: user
          }
        })
      });
    } else {
      cb({
        err: 2,
        message: "token expired"
      }); // expired
    }
  }

  login (data, cb) {
    if ((data.email || data.username) && data.password) {
      var searchObj;
      if (data.username) {
        searchObj = { username: data.username };
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
                user: user
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
      User.findOne({ username: data.username }, function(err, user) {
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
          username: data.username,
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
                user: user
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

  }
}

module.exports = Auth;