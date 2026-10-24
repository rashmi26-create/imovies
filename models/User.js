// models/User.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    watchlist: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  });

  module.exports = mongoose.models.User || mongoose.model('User', userSchema);
} else {
  module.exports = class MockUser {};
}
