const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, checkSubscription } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');

const router = express.Router();

// Get all expenses
router.get('/', auth, checkSubscription, async (req, res) => {
  try {
    const { page = 1, limit = 10, propertyId, tenantId, month, year, category } = req.query;
    const ownerId = req.user._id;

    const query = { owner: ownerId };
    if (propertyId) query.property = propertyId;
    if (tenantId) query.tenant = tenantId;
    if (month) query.month = month;
    if (year) query.year = parseInt(year);
    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .populate('property', 'name address')
      .populate('tenant', 'name')
      .sort({ expenseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense stats
router.get('/stats', auth, checkSubscription, async (req, res) => {
  try {
    const { month, year } = req.query;
    const ownerId = req.user._id;

    const query = { owner: ownerId };
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    const expenses = await Expense.find(query);

    const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const byProperty = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$property',
          total: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'properties',
          localField: '_id',
          foreignField: '_id',
          as: 'property'
        }
      },
      { $unwind: '$property' },
      { $project: { propertyName: '$property.name', total: 1 } }
    ]);

    res.json({
      monthlyTotal,
      byCategory,
      byProperty
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create expense
router.post('/', [
  auth,
  checkSubscription,
  body('property').notEmpty().withMessage('Property is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('category').isIn(['Repair', 'Maintenance', 'Utilities']).withMessage('Invalid category'),
  body('expenseDate').isISO8601().withMessage('Invalid expense date'),
  body('month').notEmpty().withMessage('Month is required'),
  body('year').isNumeric().withMessage('Year must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify property belongs to owner
    const property = await Property.findOne({
      _id: req.body.property,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Verify tenant if provided
    if (req.body.tenant) {
      const tenant = await Tenant.findOne({
        _id: req.body.tenant,
        owner: req.user._id
      });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
    }

    const expense = new Expense({
      ...req.body,
      owner: req.user._id
    });

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('property', 'name address')
      .populate('tenant', 'name');

    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', [
  auth,
  checkSubscription,
  body('amount').optional().isNumeric(),
  body('category').optional().isIn(['Repair', 'Maintenance', 'Utilities'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('property', 'name address')
      .populate('tenant', 'name');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', auth, checkSubscription, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

