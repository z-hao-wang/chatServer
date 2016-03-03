"use strict"

var User = function (data) {
  this.__data = data;
  var that = this;
  return {
    save: function (cb) {
      cb && cb(0);
      return that.__data;
    }
  }
};

module.exports = User;