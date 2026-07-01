const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Customer info
  customerName: { type: String, default: 'Guest' },
  customerEmail: { type: String, default: '' },
  customerPhone: { type: String, default: '' },

  // Order details
  item: { type: String, required: true },
  price: { type: Number, default: 0 },
  category: { type: String, default: 'Other' },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // Source tracking
  source: { type: String, default: 'website' }, // website / whatsapp / manual

  // Timestamps
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
