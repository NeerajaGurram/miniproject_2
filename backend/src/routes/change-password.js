const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Change password route - mounted at /api/change-password
router.put('/', auth, [
  body('oldpassword').notEmpty().withMessage('Current password is required'),
  body('newpassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('newpassword1').custom((value, { req }) => {
    if (value !== req.body.newpassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { oldpassword, newpassword } = req.body;
    
    // Find user by ID from auth middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(oldpassword);
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Current password is incorrect' 
      });
    }

    // Check if new password is different from old password
    const isSamePassword = await user.comparePassword(newpassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'New password must be different from current password' 
      });
    }

    // Update password
    user.password = newpassword;
    await user.save();

    console.log('Password changed successfully for user:', user.empId);

    res.json({ 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;