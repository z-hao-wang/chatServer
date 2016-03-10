var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  name: String,
  username: { type: String, required: true, unique: true },
  display_name: { type: String, required: false, unique: false },
  email: { type: String, required: false, unique: true, sparse: true },
  phone: { type: Number, required: false, unique: true, sparse: true },
  password: { type: String, required: true },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date }
});

/**
 * Convert to public visible json
 * @returns {{_id: *, username: *, displayName: *}}
 */
userSchema.methods.toPublicJSON = function () {
  var ret = {
    _id: this._id,
    username: this.username,
    display_name: this.display_name
  };
  return ret;
};

module.exports = mongoose.model('User', userSchema);