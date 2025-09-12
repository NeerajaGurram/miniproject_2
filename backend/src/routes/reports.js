const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const Research = require('../models/Research');
const { auth, authorize, authorizeFaculty } = require('../middleware/auth');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const multer = require('multer');
const xlsx = require('xlsx');
const columnConfig = require('../config/columnConfig');

const router = express.Router();

// Add column configuration for consistent display and Excel exports
const getColumnConfig = (type) => {
  return columnConfig[type] || { columns: [] };
};

// Validation middleware
const validateReport = [
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Valid year is required'),
  body('semester').isIn(['1', '2', 'annual']).withMessage('Valid semester is required'),
  body('reportType').isIn(['monthly', 'quarterly', 'annual']).withMessage('Valid report type is required')
];

// Configure multer for GridFS
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add to reports.js (after other imports)
const Seminar = require('../models/Seminar');
const Phd = require('../models/Phd');
const PhdGuiding = require('../models/PhdGuiding');
const Book = require('../models/Book');
const JournalEdited = require('../models/JournalEdited');
const ResearchGrant = require('../models/ResearchGrant');
const Patent = require('../models/Patent');
const Qualification = require('../models/Qualification');
const Visit = require('../models/Visit');
const Award = require('../models/Award');
const Membership = require('../models/Membership');
const Consultancy = require('../models/Consultancy');
const Infrastructure = require('../models/Infrastructure');
const User = require('../models/User');
const Journal = require('../models/Journal'); 

// Debug route to check data in database
router.get('/debug/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    let Model;
    
    switch(type) {
      case 'S/C/W/FDP/G':
        Model = Seminar;
        // Use the specific type filter if provided, otherwise show all seminar types
        if (req.query.type1) {
          query.type1 = req.query.type1;
        } else {
          query.type1 = { $in: ['Seminar', 'Conference', 'Workshop', 'FDP', 'Guest Lecture'] };
        }
        break;
      case 'PHD':
        Model = Phd;
        break;
      case 'PHD-GUIDING':
        Model = PhdGuiding;
        break;
      case 'JOURNALS':
        Model = Journal;
        break;
      case 'BOOKS':
        Model = Book;
        break;
      case 'JOURNAL-EDITED':
        Model = JournalEdited;
        break;
      case 'RESEARCH-GRANTS':
        Model = ResearchGrant;
        break;
      case 'PATENTS':
        Model = Patent;
        break;
      case 'QUALIFICATIONS':
        Model = Qualification;
        break;
      case 'VISITS':
        Model = Visit;
        break;
      case 'AWARDS':
        Model = Award;
        break;
      case 'MEMBERSHIP':
        Model = Membership;
        break;
      case 'CONSULTANCY':
        Model = Consultancy;
        break;
      case 'INFRASTRUCTURE':
        Model = Infrastructure;
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    const allData = await Model.find({}).limit(10).lean();
    const totalCount = await Model.countDocuments({});
    
    res.json({
      type,
      totalCount,
      sampleData: allData,
      user: {
        empId: req.user.empId,
        department: req.user.department,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Failed to debug data' });
  }
});

// Update the /data route
router.get('/data', auth, async (req, res) => {
  try {
    const { type, year, branch } = req.query;
    console.log("year:", year);
    
    // Get department from user or query
    let department = branch;
    if (!department && req.user.department && req.user.role !== 'admin') {
      // Only set default department for non-admin users
      department = req.user.department;
    }

    // Determine which model to query based on report type
    let Model, query = {};
    
    switch(type) {
      case 'S/C/W/FDP/G':
        Model = Seminar;
        if (req.query.type1) {
          query.type1 = req.query.type1;
        } else {
          query.type1 = { $in: ['Seminar', 'Conference', 'Workshop', 'FDP', 'GuestLecture'] };
        }
        break;
      case 'PHD':
        Model = Phd;
        break;
      case 'PHD-GUIDING':
        Model = PhdGuiding;
        break;
      case 'JOURNALS':
        Model = Journal;
        break;
      case 'BOOKS':
        Model = Book;
        break;
      case 'JOURNAL-EDITED':
        Model = JournalEdited;
        break;
      case 'RESEARCH-GRANTS':
        Model = ResearchGrant;
        break;
      case 'PATENTS':
        Model = Patent;
        break;
      case 'QUALIFICATIONS':
        Model = Qualification;
        break;
      case 'VISITS':
        Model = Visit;
        break;
      case 'AWARDS':
        Model = Award;
        break;
      case 'MEMBERSHIP':
        Model = Membership;
        break;
      case 'CONSULTANCY':
        Model = Consultancy;
        break;
      case 'INFRASTRUCTURE':
        Model = Infrastructure;
        break;
      // case 'SUMMARY':
      //   return handleSummaryReport(res, year, department, req.query.format === 'excel');
      default:
        return res.status(400).json({ error: 'Invalid report type or branch' });
    }

    // Add year filter if specified
    // Add academic_year filter if specified
    if (year && year !== 'ALL') {
      // Validate academic year format (e.g., "2023-24")
      if (!/^\d{4}-\d{2}$/.test(year)) {
        return res.status(400).json({ error: 'Invalid academic year format. Use format like "2023-24" (July 2023 to June 2024)' });
      }
      
      // Use academic_year field for filtering
      query.academic_year = year;
      
      console.log(`Filtering by academic year: ${year}`);
    }

    // Add department filter if user is Incharge/admin
    // Update the department filter logic
    if (department && department !== '' && ['incharge', 'admin'].includes(req.user.role)) {
      // Get faculty empIds in this specific department
      const facultyUsers = await User.find({ 
        department, 
        role: 'faculty'
      }).select('empId');
      
      const facultyEmpIds = facultyUsers.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
      console.log(`Filtering by department: ${department}`);
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own data
      query.empId = req.user.empId;
      console.log('Faculty viewing own data only');
    } else if (['incharge', 'admin'].includes(req.user.role) && (!department || department === '')) {
      // Admin/Incharge with no department selected - show ALL data (no department filter)
      console.log('Showing data for ALL branches (no department filter)');
      // No empId filtering needed - will show all faculty data
    }

    // Get data
    let data;
    try {
      console.log(`Faculty in department ${department}`);
      data = await Model.find(query).lean();
      console.log(`Found ${data.length} records for ${type} with query:`, JSON.stringify(query, null, 2));
    } catch (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ 
        error: 'Database query failed. Please check your filters and try again.',
        details: error.message 
      });
    }

    // Format data for display and add user details
    const formattedData = await Promise.all(data.map(async (item) => {
      const formatted = { ...item };
      
      // Remove unwanted fields but keep path for file checking
      delete formatted._id;
      delete formatted.__v;
      delete formatted.createdAt;
      delete formatted.updatedAt;
      // Note: We keep 'path' in the data so frontend can check if files exist
      // but exclude it from table display in the frontend
      
      // Get user details for this empId
      const user = await User.findOne({ empId: item.empId }).select('name email department');
      if (user) {
        formatted.employee = user.name;
        formatted.department = user.department;
        formatted.email = user.email;
      }
      
      // Format date fields with validation
      const dateFields = ['date', 'date1', 'date2', 'issuedate', 'pdate'];
      dateFields.forEach(field => {
        if (item[field]) {
          try {
            const date = new Date(item[field]);
            // Check if date is valid
            if (!isNaN(date.getTime())) {
              formatted[field] = date.toLocaleDateString();
            } else {
              formatted[field] = 'Invalid Date';
            }
          } catch (error) {
            formatted[field] = 'Invalid Date';
          }
        }
      });
      
      return formatted;
    }));

    // Handle Excel export
    if (req.query.format === 'excel') {
      // Get column configuration for this report type
      const config = getColumnConfig(type);
      
      // Ensure clean data for Excel export
      const cleanData = formattedData.map(item => {
        const clean = {};
        
        if (config.columns.length > 0) {
          // Use configured columns in order
          config.columns.forEach(col => {
            if (item[col.key] !== undefined) {
              clean[col.label] = item[col.key];
            }
          });
        } else {
          // Fallback: remove unwanted fields
          Object.keys(item).forEach(key => {
            if (!['_id', 'path', '__v', 'createdAt', 'updatedAt'].includes(key)) {
              clean[key] = item[key];
            }
          });
        }
        
        return clean;
      });
      
      const ws = xlsx.utils.json_to_sheet(cleanData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Report");
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_${year || 'all'}_report.xlsx`);
      return res.end(xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    }

    res.json(formattedData);
  } catch (error) {
    console.error('Report data error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Helper function for summary report
async function handleSummaryReport(res, year, department, excelFormat) {
  try {
    // Get faculty in department
    const facultyQuery = { role: 'faculty' };
    if (department && department !== '') {
      facultyQuery.department = department;
      console.log(`Filtering summary by department: ${department}`);
    } else {
      console.log('Showing summary for ALL departments');
    }
    
    const faculty = await User.find(facultyQuery).select('empId name department');
    const facultyEmpIds = faculty.map(f => f.empId);

    // Build date filter for year if specified
    let dateFilter = {};
    if (year && year !== 'ALL') {
      const [startYear, endYear] = year.split('-');
      
      // Validate year values
      if (!startYear || !endYear || isNaN(startYear) || isNaN(endYear)) {
        return res.status(400).json({ error: 'Invalid academic year format. Use format like "2023-24" (July 2023 to June 2024)' });
      }
      
      // Handle academic year: 2017-18 means July 2017 to June 2018
      const startDate = new Date(`${startYear}-07-01`); // July 1st of start year
      const endDate = new Date(`${endYear}-06-30`);     // June 30th of end year
      
      console.log(`Summary academic year ${year}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Validate that dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid year range' });
      }
      
      // Handle different date field names
      const dateFields = ['date', 'date1', 'date2', 'issuedate', 'pdate'];
      dateFilter = {
        $or: dateFields.map(field => ({
          [field]: { 
            $gte: startDate, 
            $lte: endDate,
            $ne: null,  // Exclude null values
            $exists: true  // Field must exist
          }
        }))
      };
    }

    // Get counts for each report type
    const summary = await Promise.all([
      Seminar.countDocuments({ 
        ...dateFilter, 
        empId: { $in: facultyEmpIds },
        type1: { $in: ['Seminar', 'Conference', 'Workshop', 'FDP', 'Guest Lecture'] }
      }).catch(() => 0),
      // Individual seminar types
      Seminar.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds }, type1: 'Seminar' }).catch(() => 0),
      Seminar.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds }, type1: 'Conference' }).catch(() => 0),
      Seminar.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds }, type1: 'Workshop' }).catch(() => 0),
      Seminar.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds }, type1: 'FDP' }).catch(() => 0),
      Seminar.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds }, type1: 'GuestLecture' }).catch(() => 0),
      Phd.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      PhdGuiding.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Journal.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Book.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      JournalEdited.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      ResearchGrant.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Patent.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Qualification.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Visit.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Award.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Membership.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Consultancy.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0),
      Infrastructure.countDocuments({ ...dateFilter, empId: { $in: facultyEmpIds } }).catch(() => 0)
    ]);

    // Format summary data
    const reportTypes = [
      'S/C/W/FDP/G', 'SEMINAR', 'CONFERENCE', 'WORKSHOP', 'FDP', 'GUEST-LECTURE', 'PHD', 'PHD-GUIDING', 'JOURNALS',
      'BOOKS', 'JOURNAL-EDITED', 'RESEARCH-GRANTS', 'PATENTS',
      'QUALIFICATIONS', 'VISITS', 'AWARDS', 'MEMBERSHIP',
      'CONSULTANCY', 'INFRASTRUCTURE'
    ];

    const summaryData = reportTypes.map((type, index) => ({
      type,
      count: summary[index] || 0
    }));

    // Add totals
    summaryData.push({
      type: 'TOTAL',
      count: summary.reduce((a, b) => a + b, 0)
    });

    if (excelFormat) {
      // Get column configuration for summary reports
      const config = getColumnConfig('SUMMARY');
      
      // Clean summary data for Excel export
      const cleanSummaryData = summaryData.map(item => {
        const clean = {};
        config.columns.forEach(col => {
          if (item[col.key] !== undefined) {
            clean[col.label] = item[col.key];
          }
        });
        return clean;
      });
      
      const ws = xlsx.utils.json_to_sheet(cleanSummaryData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Summary");
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=SUMMARY_${year || 'all'}_report.xlsx`);
      return res.end(xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    }

    res.json({
      facultyCount: faculty.length,
      department: department || 'All Departments',
      year: year || 'All Years',
      data: summaryData
    });
  } catch (error) {
    throw error;
  }
}

router.get('/academic-years', auth, async (req, res) => {
  try {
    const models = [
      Seminar, Phd, PhdGuiding, Journal, Book, JournalEdited,
      ResearchGrant, Patent, Qualification, Visit, Award,
      Membership, Consultancy, Infrastructure
    ];

    const yearsSet = new Set();

    for (const Model of models) {
      const records = await Model.find({ academic_year: { $exists: true } }).select('academic_year');
      records.forEach(r => {
        if (r.academic_year) {
          yearsSet.add(r.academic_year);
        }
      });
    }

    const uniqueYears = Array.from(yearsSet).sort(); // Optional: sort years
    res.json(uniqueYears);
  } catch (err) {
    console.error('Error fetching academic years:', err);
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
});

module.exports = router; 