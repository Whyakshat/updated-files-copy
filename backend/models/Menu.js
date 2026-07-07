const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name required hai'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category required hai'],
    enum: ['Thali', 'Paratha', 'Addon', 'Weekly', 'Monthly', 'Other'],
    default: 'Other'
  },
  price: {
    type: Number,
    required: [true, 'Price required hai'],
    min: [0, 'Price minimum 0 hona chahiye']
  },
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Menu', menuSchema);
