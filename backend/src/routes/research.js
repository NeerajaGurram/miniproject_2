const express = require('express');
const { body, validationResult } = require('express-validator');
const Research = require('../models/Research');
const { auth, authorize, authorizeFaculty, canModifyResearch } = require('../middleware/auth');
const { uploadResearchAttachments, handleUploadError, getFileInfo, deleteFile } = require('../middleware/upload');

const router = express.Router();

// Validation middleware for research creation
const validateResearch = [
  body('type').isIn([
    'seminar', 'journal', 'book', 'phd', 'award', 
    'patent', 'visit', 'consultancy', 'infrastructure', 'grant'
  ]).withMessage('Invalid research type'),
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('description').optional().trim()
];

// Create new research entry
router.post('/', auth, validateResearch, uploadResearchAttachments, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const researchData = {
      facultyId: req.user._id,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      date: new Date(req.body.date),
      details: req.body.details || {},
      tags: req.body.tags || [],
      visibility: req.body.visibility || 'public'
    };

    // Handle file attachments
    if (req.files && req.files.length > 0) {
      researchData.attachments = req.files.map(file => getFileInfo(file));
    }

    const research = new Research(researchData);
    await research.save();

    // Populate faculty details
    await research.populate('faculty', 'name email department');

    res.status(201).json({
      message: 'Research entry created successfully',
      research
    });
  } catch (error) {
    console.error('Create research error:', error);
    res.status(500).json({ 
      error: 'Failed to create research entry' 
    });
  }
});

// Get all research entries (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status, 
      facultyId, 
      search, 
      startDate, 
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // Apply filters based on user role
    if (req.user.role === 'faculty') {
      filter.facultyId = req.user._id;
    } else if (facultyId) {
      filter.facultyId = facultyId;
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const research = await Research.find(filter)
      .populate('faculty', 'name email department')
      .populate('verifier', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const total = await Research.countDocuments(filter);

    res.json({
      research,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get research error:', error);
    res.status(500).json({ 
      error: 'Failed to get research entries' 
    });
  }
});

// Get research by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const research = await Research.findById(req.params.id)
      .populate('faculty', 'name email department')
      .populate('verifier', 'name');

    if (!research) {
      return res.status(404).json({ 
        error: 'Research entry not found' 
      });
    }

    // Check access permissions
    if (req.user.role === 'faculty' && research.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    res.json({ research });
  } catch (error) {
    console.error('Get research by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to get research entry' 
    });
  }
});

// Update research entry
router.put('/:id', auth, canModifyResearch, validateResearch, uploadResearchAttachments, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const updateData = {
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      date: new Date(req.body.date),
      details: req.body.details || req.research.details,
      tags: req.body.tags || req.research.tags,
      visibility: req.body.visibility || req.research.visibility
    };

    // Handle new file attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => getFileInfo(file));
      updateData.attachments = [...req.research.attachments, ...newAttachments];
    }

    const research = await Research.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('faculty', 'name email department');

    res.json({
      message: 'Research entry updated successfully',
      research
    });
  } catch (error) {
    console.error('Update research error:', error);
    res.status(500).json({ 
      error: 'Failed to update research entry' 
    });
  }
});

// Delete research entry
router.delete('/:id', auth, canModifyResearch, async (req, res) => {
  try {
    // Delete associated files
    if (req.research.attachments && req.research.attachments.length > 0) {
      req.research.attachments.forEach(attachment => {
        deleteFile(attachment.path);
      });
    }

    await Research.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Research entry deleted successfully' 
    });
  } catch (error) {
    console.error('Delete research error:', error);
    res.status(500).json({ 
      error: 'Failed to delete research entry' 
    });
  }
});

// Approve/Reject research entry (admin/HOD only)
router.put('/:id/status', auth, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be "approved" or "rejected"' 
      });
    }

    const updateData = {
      status,
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const research = await Research.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('faculty', 'name email department');

    if (!research) {
      return res.status(404).json({ 
        error: 'Research entry not found' 
      });
    }

    res.json({
      message: `Research entry ${status} successfully`,
      research
    });
  } catch (error) {
    console.error('Update research status error:', error);
    res.status(500).json({ 
      error: 'Failed to update research status' 
    });
  }
});

// Get research statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { facultyId, startDate, endDate } = req.query;
    
    const filter = {};
    
    // Apply faculty filter based on user role
    if (req.user.role === 'faculty') {
      filter.facultyId = req.user._id;
    } else if (facultyId) {
      filter.facultyId = facultyId;
    }

    // Apply date filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const stats = await Research.getStats(filter);

    // Calculate totals
    const totals = stats.reduce((acc, stat) => {
      acc.total += stat.count;
      acc.approved += stat.approved;
      acc.pending += stat.pending;
      acc.rejected += stat.rejected;
      return acc;
    }, { total: 0, approved: 0, pending: 0, rejected: 0 });

    res.json({
      stats,
      totals
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics' 
    });
  }
});

// Get pending research entries (admin/HOD only)
router.get('/pending/all', auth, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const research = await Research.find({ status: 'pending' })
      .populate('faculty', 'name email department')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Research.countDocuments({ status: 'pending' });

    res.json({
      research,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get pending research error:', error);
    res.status(500).json({ 
      error: 'Failed to get pending research entries' 
    });
  }
});

// Delete attachment
router.delete('/:id/attachments/:attachmentId', auth, canModifyResearch, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const research = req.research;

    const attachment = research.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ 
        error: 'Attachment not found' 
      });
    }

    // Delete file from filesystem
    deleteFile(attachment.path);

    // Remove attachment from research
    research.attachments.pull(attachmentId);
    await research.save();

    res.json({ 
      message: 'Attachment deleted successfully' 
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ 
      error: 'Failed to delete attachment' 
    });
  }
});

// Handle upload errors
router.use(handleUploadError);

module.exports = router; 