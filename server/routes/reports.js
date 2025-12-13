const express = require('express');
const { auth, checkSubscription } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');

const router = express.Router();

// Balance Sheet
router.get('/balance-sheet', auth, checkSubscription, async (req, res) => {
  try {
    const { month, year } = req.query;
    const ownerId = req.user._id;

    const query = { owner: ownerId };
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    const payments = await Payment.find(query);
    const expenses = await Expense.find(query);

    const totalIncome = payments
      .filter(p => p.paymentType === 'Rent')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    res.json({
      period: { month, year },
      income: {
        rent: totalIncome,
        total: totalIncome
      },
      expenses: {
        total: totalExpenses,
        byCategory: expenses.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {})
      },
      netProfit
    });
  } catch (error) {
    console.error('Balance sheet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Property-wise income
router.get('/property-income', auth, checkSubscription, async (req, res) => {
  try {
    const { month, year } = req.query;
    const ownerId = req.user._id;

    const query = { owner: ownerId, paymentType: 'Rent' };
    if (month) query.month = month;
    if (year) query.year = parseInt(year);

    const propertyIncome = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$property',
          totalIncome: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
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
      {
        $project: {
          propertyName: '$property.name',
          propertyAddress: '$property.address',
          totalIncome: 1,
          paymentCount: 1
        }
      },
      { $sort: { totalIncome: -1 } }
    ]);

    res.json(propertyIncome);
  } catch (error) {
    console.error('Property income error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Tenant ledger report
router.get('/tenant-ledger/:tenantId', auth, checkSubscription, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.tenantId,
      owner: req.user._id
    }).populate('property', 'name address');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const payments = await Payment.find({
      tenant: req.params.tenantId,
      owner: req.user._id
    }).sort({ paymentDate: 1, createdAt: 1 });

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
        runningBalance
      };
    });

    res.json({
      tenant: {
        name: tenant.name,
        mobile: tenant.mobile,
        property: tenant.property,
        rentAmount: tenant.rentAmount,
        deposit: tenant.deposit
      },
      ledger,
      currentBalance: runningBalance
    });
  } catch (error) {
    console.error('Tenant ledger report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Yearly summary
router.get('/yearly-summary', auth, checkSubscription, async (req, res) => {
  try {
    const { year } = req.query;
    const ownerId = req.user._id;

    if (!year) {
      return res.status(400).json({ message: 'Year is required' });
    }

    const payments = await Payment.find({
      owner: ownerId,
      year: parseInt(year),
      paymentType: 'Rent'
    });

    const expenses = await Expense.find({
      owner: ownerId,
      year: parseInt(year)
    });

    const monthlyData = {};
    for (let month = 1; month <= 12; month++) {
      const monthName = new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
      monthlyData[monthName] = {
        income: 0,
        expenses: 0,
        profit: 0
      };
    }

    payments.forEach(payment => {
      if (monthlyData[payment.month]) {
        monthlyData[payment.month].income += payment.amount;
      }
    });

    expenses.forEach(expense => {
      if (monthlyData[expense.month]) {
        monthlyData[expense.month].expenses += expense.amount;
      }
    });

    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expenses;
    });

    const yearlyTotal = {
      income: payments.reduce((sum, p) => sum + p.amount, 0),
      expenses: expenses.reduce((sum, e) => sum + e.amount, 0)
    };
    yearlyTotal.profit = yearlyTotal.income - yearlyTotal.expenses;

    res.json({
      year: parseInt(year),
      monthlyData,
      yearlyTotal
    });
  } catch (error) {
    console.error('Yearly summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

