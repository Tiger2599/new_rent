const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['owner', 'admin'],
    default: 'owner'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'monthly', 'yearly'],
      default: 'free'
    },
    trialStartDate: {
      type: Date,
      default: Date.now
    },
    trialEndDate: {
      type: Date,
      default: function() {
        const date = new Date();
        date.setDate(date.getDate() + 60);
        return date;
      }
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    razorpaySubscriptionId: String,
    razorpayCustomerId: String
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isTrialActive = function() {
  return this.subscription.trialEndDate > new Date();
};

userSchema.methods.hasActiveSubscription = function() {
  if (this.isTrialActive()) return true;
  if (this.subscription.plan === 'free') return false;
  if (this.subscription.subscriptionEndDate) {
    return this.subscription.subscriptionEndDate > new Date();
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);

