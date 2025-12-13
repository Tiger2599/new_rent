const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, checkSubscription } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');

const router = express.Router();

// Get all payments
router.get('/', auth, checkSubscription, async (req, res) => {
  try {
    const { page = 1, limit = 10, tenantId, propertyId, month, year } = req.query;
    const ownerId = req.user._id;

    const query = { owner: ownerId };
    if (tenantId) query.tenant = tenantId;
    if (propertyId) query.property = propertyId;
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    const payments = await Payment.find(query)
      .populate('tenant', 'name mobile')
      .populate('property', 'name address')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single payment
router.get('/:id', auth, checkSubscription, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      owner: req.user._id
    })
      .populate('tenant', 'name mobile')
      .populate('property', 'name address');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create payment
router.post('/', [
  auth,
  checkSubscription,
  body('tenant').notEmpty().withMessage('Tenant is required'),
  body('property').notEmpty().withMessage('Property is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentMode').isIn(['Cash', 'UPI', 'Bank Transfer']).withMessage('Invalid payment mode'),
  body('paymentDate').isISO8601().withMessage('Invalid payment date'),
  body('month').notEmpty().withMessage('Month is required'),
  body('year').isNumeric().withMessage('Year must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify tenant and property belong to owner
    const tenant = await Tenant.findOne({
      _id: req.body.tenant,
      owner: req.user._id
    });

    const property = await Property.findOne({
      _id: req.body.property,
      owner: req.user._id
    });

    if (!tenant || !property) {
      return res.status(404).json({ message: 'Tenant or Property not found' });
    }

    const payment = new Payment({
      ...req.body,
      owner: req.user._id
    });

    await payment.save();

    // Update tenant balance
    if (req.body.paymentType === 'Rent') {
      tenant.currentBalance = (tenant.currentBalance || 0) - req.body.amount;
      await tenant.save();
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('tenant', 'name mobile')
      .populate('property', 'name address');

    res.status(201).json(populatedPayment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment
router.put('/:id', [
  auth,
  checkSubscription,
  body('amount').optional().isNumeric(),
  body('paymentMode').optional().isIn(['Cash', 'UPI', 'Bank Transfer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const oldPayment = await Payment.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!oldPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('tenant', 'name mobile')
      .populate('property', 'name address');

    // Update tenant balance if rent amount changed
    if (oldPayment.paymentType === 'Rent' && req.body.amount) {
      const tenant = await Tenant.findById(oldPayment.tenant);
      const balanceDiff = oldPayment.amount - req.body.amount;
      tenant.currentBalance = (tenant.currentBalance || 0) + balanceDiff;
      await tenant.save();
    }

    res.json(payment);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete payment
router.delete('/:id', auth, checkSubscription, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update tenant balance
    if (payment.paymentType === 'Rent') {
      const tenant = await Tenant.findById(payment.tenant);
      tenant.currentBalance = (tenant.currentBalance || 0) + payment.amount;
      await tenant.save();
    }

    await payment.deleteOne();

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tenant ledger
router.get('/tenant/:tenantId/ledger', auth, checkSubscription, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.tenantId,
      owner: req.user._id
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const payments = await Payment.find({
      tenant: req.params.tenantId,
      owner: req.user._id
    })
      .sort({ paymentDate: 1, createdAt: 1 });

    // Calculate running balance
    let runningBalance = tenant.deposit || 0;
    const ledger = payments.map(payment => {
      if (payment.paymentType === 'Rent') {
        runningBalance -= payment.amount;
      } else {
        runningBalance += payment.amount;
      }
      return {
        date: payment.paymentDate,
        type: payment.paymentType,
        amount: payment.amount,
        mode: payment.paymentMode,
        month: payment.month,
        year: payment.year,
        notes: payment.notes,
        runningBalance,
        // Keep original fields for backward compatibility
        paymentDate: payment.paymentDate,
        paymentType: payment.paymentType,
        paymentMode: payment.paymentMode
      };
    });

    res.json({
      tenant: {
        id: tenant._id,
        name: tenant.name,
        mobile: tenant.mobile,
        rentAmount: tenant.rentAmount,
        deposit: tenant.deposit
      },
      ledger,
      currentBalance: runningBalance
    });
  } catch (error) {
    console.error('Get ledger error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

