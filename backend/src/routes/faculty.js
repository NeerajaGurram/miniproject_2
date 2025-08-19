const express = require('express');
const router = express.Router();
const Research = require('../models/Research');
const User = require('../models/User');
const Report = require('../models/Report');
const { auth, authorize } = require('../middleware/auth');

// Get faculty dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const facultyId = req.user._id;
    
    // Get faculty's research statistics
    const researchStats = await Research.aggregate([
      { $match: { facultyId: facultyId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    // Get recent research entries
    const recentResearch = await Research.find({ facultyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('facultyId', 'name email department');

    // Get faculty profile
    const faculty = await User.findById(facultyId).select('-password');

    res.json({
      success: true,
      data: {
        stats: researchStats,
        recentResearch,
        faculty
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Get research by type (equivalent to PHP req parameter)
router.get('/research/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const facultyId = req.user._id;
    const { page = 1, limit = 10, status, year } = req.query;

    const query = { facultyId, type };
    
    if (status) query.status = status;
    if (year) {
      query.date = {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      };
    }

    const research = await Research.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('facultyId', 'name email department');

    const total = await Research.countDocuments(query);

    res.json({
      success: true,
      data: research,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Research fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch research data' });
  }
});

// Get department overview (for Incharge/Admin)
router.get('/department/:department', auth, authorize(['admin', 'incharge']), async (req, res) => {
  try {
    const { department } = req.params;
    const { year } = req.query;

    const query = { department };
    if (year) {
      query['details.date'] = {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      };
    }

    // Get faculty in department
    const faculty = await User.find({ department, role: 'faculty' })
      .select('name email department designation');

    // Get research statistics by type
    const researchStats = await Research.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'facultyId',
          foreignField: '_id',
          as: 'faculty'
        }
      },
      { $unwind: '$faculty' },
      { $match: { 'faculty.department': department } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        faculty,
        researchStats,
        department
      }
    });
  } catch (error) {
    console.error('Department overview error:', error);
    res.status(500).json({ error: 'Failed to load department overview' });
  }
});

// Get research statistics by type
router.get('/stats/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { year, facultyId } = req.query;

    const query = { type };
    if (year) {
      query.date = {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      };
    }
    if (facultyId) query.facultyId = facultyId;

    const stats = await Research.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || { total: 0, approved: 0, pending: 0, rejected: 0 }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router; 