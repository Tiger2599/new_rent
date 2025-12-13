const express = require('express');
const { auth, checkSubscription } = require('../middleware/auth');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

const router = express.Router();

router.get('/stats', auth, checkSubscription, async (req, res) => {
  try {
    const ownerId = req.user._id;
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();

    // Total counts
    const totalProperties = await Property.countDocuments({ owner: ownerId });
    const totalTenants = await Tenant.countDocuments({ owner: ownerId });

    // Current month stats
    const currentMonthPayments = await Payment.find({
      owner: ownerId,
      month: currentMonth,
      year: currentYear
    });

    const rentDue = await Tenant.aggregate([
      { $match: { owner: ownerId } },
      { $group: { _id: null, total: { $sum: '$rentAmount' } } }
    ]);

    const rentCollected = currentMonthPayments
      .filter(p => p.paymentType === 'Rent')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingRent = (rentDue[0]?.total || 0) - rentCollected;

    // Vacant properties
    const vacantCount = await Property.countDocuments({
      owner: ownerId,
      status: 'Vacant'
    });

    // Agreement expiry alerts (within next 30 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const expiringAgreements = await Tenant.find({
      owner: ownerId,
      agreementEndDate: { $lte: expiryDate, $gte: now }
    }).populate('property', 'name address').select('name property agreementEndDate');

    // Recent transactions
    const recentTransactions = await Payment.find({ owner: ownerId })
      .populate('tenant', 'name')
      .populate('property', 'name')
      .sort({ paymentDate: -1 })
      .limit(10)
      .select('amount paymentType paymentMode paymentDate tenant property');

    res.json({
      totalProperties,
      totalTenants,
      thisMonth: {
        rentDue: rentDue[0]?.total || 0,
        rentCollected,
        pendingRent
      },
      vacantCount,
      expiringAgreements,
      recentTransactions
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

