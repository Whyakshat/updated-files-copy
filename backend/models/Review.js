const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: false,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  sentiment: {
    type: String,
    enum: ['HAPPY', 'ANGRY', 'FOOD_QUALITY', 'NEUTRAL'],
    default: 'NEUTRAL'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
