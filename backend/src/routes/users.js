const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, branch, search, isActive } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (branch) filter.branch = branch;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to get users' 
    });
  }
});

// Get user by ID
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to get user' 
    });
  }
});

// Update user (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, branch, department, designation, phone, isActive } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (branch) updateData.branch = branch;
    if (department) updateData.department = department;
    if (designation) updateData.designation = designation;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      error: 'Failed to update user' 
    });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user' 
    });
  }
});

// Get user statistics
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const hodCount = await User.countDocuments({ role: 'hod' });

    // Get users by branch
    const branchStats = await User.aggregate([
      {
        $group: {
          _id: '$branch',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      facultyCount,
      adminCount,
      hodCount,
      branchStats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get user statistics' 
    });
  }
});

module.exports = router; 