const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['Rent', 'Deposit', 'Token', 'Extra'],
    default: 'Rent'
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer'],
    required: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  razorpayPaymentId: String,
  razorpayOrderId: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);

