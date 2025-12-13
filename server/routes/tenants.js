const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, checkSubscription } = require('../middleware/auth');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Get all tenants
router.get('/', auth, checkSubscription, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', propertyId } = req.query;
    const ownerId = req.user._id;

    const query = { owner: ownerId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    if (propertyId) {
      query.property = propertyId;
    }

    const tenants = await Tenant.find(query)
      .populate('property', 'name address type')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tenant.countDocuments(query);

    res.json({
      tenants,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single tenant
router.get('/:id', auth, checkSubscription, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).populate('property', 'name address type');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create tenant
router.post('/', [
  auth,
  checkSubscription,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').trim().notEmpty().withMessage('Mobile is required'),
  body('property').notEmpty().withMessage('Property is required'),
  body('rentAmount').isNumeric().withMessage('Rent amount must be a number'),
  body('rentStartDate').isISO8601().withMessage('Invalid rent start date'),
  body('agreementEndDate').isISO8601().withMessage('Invalid agreement end date')
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

    const tenant = new Tenant({
      ...req.body,
      owner: req.user._id
    });

    await tenant.save();

    // Update property status to Occupied
    property.status = 'Occupied';
    await property.save();

    const populatedTenant = await Tenant.findById(tenant._id)
      .populate('property', 'name address type');

    res.status(201).json(populatedTenant);
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update tenant
router.put('/:id', [
  auth,
  checkSubscription,
  body('name').optional().trim().notEmpty(),
  body('mobile').optional().trim().notEmpty(),
  body('rentAmount').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('property', 'name address type');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload document
router.post('/:id/documents/:type', auth, checkSubscription, upload.single('file'), async (req, res) => {
  try {
    const { id, type } = req.params;
    const validTypes = ['aadhaar', 'agreement', 'photo'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const tenant = await Tenant.findOne({
      _id: id,
      owner: req.user._id
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Delete old document if exists
    if (tenant.documents[type]?.publicId) {
      await cloudinary.uploader.destroy(tenant.documents[type].publicId);
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: `tenant-documents/${id}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    tenant.documents[type] = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };

    await tenant.save();

    res.json({ message: 'Document uploaded successfully', document: tenant.documents[type] });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete tenant
router.delete('/:id', auth, checkSubscription, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Delete documents from Cloudinary
    for (const docType of ['aadhaar', 'agreement', 'photo']) {
      if (tenant.documents[docType]?.publicId) {
        await cloudinary.uploader.destroy(tenant.documents[docType].publicId);
      }
    }

    const propertyId = tenant.property;
    await tenant.deleteOne();

    // Update property status if no tenants
    const tenantCount = await Tenant.countDocuments({ property: propertyId });
    if (tenantCount === 0) {
      await Property.findByIdAndUpdate(propertyId, { status: 'Vacant' });
    }

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

