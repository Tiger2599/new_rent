const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get all users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block/Unblock user
router.patch('/users/:id/block', auth, adminOnly, async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Extend trial
router.patch('/users/:id/extend-trial', auth, adminOnly, async (req, res) => {
  try {
    const { days } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newTrialEndDate = new Date(user.subscription.trialEndDate);
    newTrialEndDate.setDate(newTrialEndDate.getDate() + (days || 0));

    user.subscription.trialEndDate = newTrialEndDate;
    await user.save();

    res.json({
      message: 'Trial extended successfully',
      trialEndDate: user.subscription.trialEndDate
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subscription
router.patch('/users/:id/subscription', auth, adminOnly, async (req, res) => {
  try {
    const { plan, subscriptionStartDate, subscriptionEndDate } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.subscription.plan = plan || user.subscription.plan;
    if (subscriptionStartDate) {
      user.subscription.subscriptionStartDate = new Date(subscriptionStartDate);
    }
    if (subscriptionEndDate) {
      user.subscription.subscriptionEndDate = new Date(subscriptionEndDate);
    }

    await user.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'owner' });
    const activeTrials = await User.countDocuments({
      role: 'owner',
      'subscription.trialEndDate': { $gt: new Date() }
    });
    const activeSubscriptions = await User.countDocuments({
      role: 'owner',
      'subscription.plan': { $in: ['monthly', 'yearly'] },
      'subscription.subscriptionEndDate': { $gt: new Date() }
    });
    const blockedUsers = await User.countDocuments({
      role: 'owner',
      isBlocked: true
    });

    res.json({
      totalUsers,
      activeTrials,
      activeSubscriptions,
      blockedUsers
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

