// server/models/User.js
let mongoose;
let bcrypt;

try {
  mongoose = require('mongoose');
  bcrypt = require('bcryptjs');
} catch (e) {
  mongoose = null;
  bcrypt = null;
}

if (mongoose && mongoose.Schema) {
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  }, { timestamps: true });

  // Pre-save password hashing hook
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    if (bcrypt) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  });

  // Password comparison method
  userSchema.methods.comparePassword = async function (enteredPassword) {
    if (bcrypt && this.password.startsWith('$2')) {
      return await bcrypt.compare(enteredPassword, this.password);
    }
    return enteredPassword === this.password;
  };

  module.exports = mongoose.models.User || mongoose.model('User', userSchema);
} else {
  module.exports = class MockUser {};
}
