const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  rentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deposit: {
    type: Number,
    default: 0,
    min: 0
  },
  rentStartDate: {
    type: Date,
    required: true
  },
  agreementEndDate: {
    type: Date,
    required: true
  },
  documents: {
    aadhaar: {
      url: String,
      publicId: String
    },
    agreement: {
      url: String,
      publicId: String
    },
    photo: {
      url: String,
      publicId: String
    }
  },
  notes: {
    type: String,
    default: ''
  },
  currentBalance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tenant', tenantSchema);

