const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Seminar = require('../models/Seminar');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'seminars';

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

function getAcademicYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // January is 0, so add 1
  
  // If current date is between June 1st (month 6) and May 31st (month 5 next year)
  if (currentMonth >= 6) {
    // June to December: current year to next year (e.g., 2025-26)
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  } else {
    // January to May: previous year to current year (e.g., 2024-25)
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  }
}

// POST route to create a new seminar/conference record
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, type1, type2, type3, host, agency, comment, date1, date2 } = req.body;
    if (!title || !type1 || !type2 || !type3 || !host || !agency || !comment || !date1 || !date2) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db);

    const uploadStream = bucket.openUploadStream(`${req.user.empId}_${Date.now()}_${req.file.originalname}`);
    uploadStream.end(req.file.buffer);

    const academic_year = getAcademicYear();

    uploadStream.on('finish', async (file) => {
      const seminarRecord = new Seminar({
        empId: req.user.empId,
        title,
        type1,
        type2,
        type3,
        host,
        agency,
        comment,
        date1: new Date(date1),
        date2: new Date(date2),
        path: uploadStream.filename,
        academic_year,
        status: 'Pending' // Default status
      });

      await seminarRecord.save();
      client.close();
      res.status(201).json({
        message: 'Seminar details submitted successfully',
        data: seminarRecord
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error submitting Seminar details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to fetch seminars with optional status filter
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    // If user is incharge, only show seminars from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own seminars
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const seminars = await Seminar.find(query).lean();
    
    // Populate user details for each seminar
    const seminarsWithUserDetails = await Promise.all(
      seminars.map(async (seminar) => {
        const user = await User.findOne({ empId: seminar.empId }).select('name department').lean();
        return {
          ...seminar,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );
    
    res.json(seminarsWithUserDetails);
  } catch (error) {
    console.error('Error fetching seminars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update seminar status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check if user has permission to update status (admin or incharge)
    if (!['admin', 'incharge'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // If user is incharge, verify the seminar belongs to their department
    if (req.user.role === 'incharge') {
      const seminar = await Seminar.findById(id);
      if (!seminar) {
        return res.status(404).json({ error: 'Seminar not found' });
      }
      
      // Get the faculty member who submitted the seminar
      const faculty = await User.findOne({ empId: seminar.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update seminars from your department' });
      }
    }
    
    const updatedSeminar = await Seminar.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!updatedSeminar) {
      return res.status(404).json({ error: 'Seminar not found' });
    }
    
    res.json({
      message: 'Seminar status updated successfully',
      data: updatedSeminar
    });
  } catch (error) {
    console.error('Error updating seminar status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to download seminar file
router.get('/file/:path', async (req, res) => {
  const { path } = req.params;
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db);

    const downloadStream = bucket.openDownloadStreamByName(path);

    res.setHeader('Content-Type', 'application/pdf');
    downloadStream.pipe(res);
    downloadStream.on('end', () => client.close());
    downloadStream.on('error', () => {
      client.close();
      res.status(404).json({ error: 'File not found' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to fetch pending count for incharge users
router.get('/pending-count', auth, async (req, res) => {
  try {
    // Only incharge users can access this endpoint
    if (req.user.role !== 'incharge') {
      return res.status(403).json({ error: 'Access denied. Only incharge users can view pending counts.' });
    }
    
    // Get faculty in the same department as incharge
    const facultyInDepartment = await User.find({ 
      department: req.user.department, 
      role: 'faculty' 
    }).select('empId');
    
    const facultyEmpIds = facultyInDepartment.map(f => f.empId);
    
    // Count pending seminars for faculty in the incharge's department
    const pendingCount = await Seminar.countDocuments({
      empId: { $in: facultyEmpIds },
      status: 'Pending'
    });
    
    res.json({ count: pendingCount });
  } catch (error) {
    console.error('Error fetching pending seminars count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;