var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  name: String,
  username: { type: String, required: true, unique: true },
  email: { type: String, required: false, unique: true },
  phone: { type: Number, required: false, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date }
});

var User = mongoose.model('User', userSchema);

module.exports = User;