// server/controllers/authController.js
let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  jwt = null;
}

const { memoryStore, isMongoConnected } = require('../config/db');
let User;
try {
  User = require('../models/User');
} catch (e) {
  User = null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_imovies_2026';

function generateToken(user) {
  const payload = { id: user._id || user.id, email: user.email, name: user.name, role: user.role };
  if (jwt) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (isMongoConnected() && User && User.findOne) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'User already exists with this email address' });
      }
      const newUser = new User({ name, email, password, role: 'user' });
      await newUser.save();
      const token = generateToken(newUser);
      return res.status(201).json({
        message: 'Account registered successfully',
        token,
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
      });
    }

    // Memory Store Fallback
    const existingMem = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingMem) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }
    const newUserMem = { id: 'usr-' + Date.now(), name, email, password, role: 'user' };
    memoryStore.users.push(newUserMem);
    memoryStore.saveToDisk();

    const token = generateToken(newUserMem);
    return res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: { id: newUserMem.id, name: newUserMem.name, email: newUserMem.email, role: newUserMem.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (isMongoConnected() && User && User.findOne) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = generateToken(user);
      return res.json({
        message: 'Signed in successfully',
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    }

    // Memory Store Fallback
    const userMem = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!userMem || userMem.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(userMem);
    return res.json({
      message: 'Signed in successfully',
      token,
      user: { id: userMem.id, name: userMem.name, email: userMem.email, role: userMem.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};
