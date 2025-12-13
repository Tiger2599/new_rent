const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, checkSubscription } = require('../middleware/auth');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');

const router = express.Router();

// Get all properties
router.get('/', auth, checkSubscription, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const ownerId = req.user._id;

    const query = { owner: ownerId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Property.countDocuments(query);

    res.json({
      properties,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single property
router.get('/:id', auth, checkSubscription, async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create property
router.post('/', [
  auth,
  checkSubscription,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('type').isIn(['Flat', 'House', 'Shop']).withMessage('Invalid property type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = new Property({
      ...req.body,
      owner: req.user._id
    });

    await property.save();
    res.status(201).json(property);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update property
router.put('/:id', [
  auth,
  checkSubscription,
  body('name').optional().trim().notEmpty(),
  body('address').optional().trim().notEmpty(),
  body('type').optional().isIn(['Flat', 'House', 'Shop'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete property
router.delete('/:id', auth, checkSubscription, async (req, res) => {
  try {
    // Check if property has tenants
    const tenantCount = await Tenant.countDocuments({ property: req.params.id });
    if (tenantCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete property with active tenants' 
      });
    }

    const property = await Property.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

