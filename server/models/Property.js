const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Flat', 'House', 'Shop'],
    required: true
  },
  rentCycle: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    default: 'Monthly'
  },
  status: {
    type: String,
    enum: ['Occupied', 'Vacant'],
    default: 'Vacant'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);

