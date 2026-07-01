const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name required hai'],
    trim: true,
    minlength: [2, 'Name kam se kam 2 characters ka hona chahiye']
  },
  email: {
    type: String,
    required: [true, 'Email required hai'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Valid email daalen']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, '10-digit phone number daalen']
  },
  password: {
    type: String,
    required: [true, 'Password required hai'],
    minlength: [6, 'Password kam se kam 6 characters ka hona chahiye'],
    select: false  // password will not be included in query results
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password verify karne ka method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
