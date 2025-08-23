const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Award = require('../models/Award');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'awards';

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
  limits: { fileSize: 50 * 1024 * 1024 }
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

// POST route to create a new award
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { award, type1, type2, agency, ifany, date2 } = req.body;
    if (!award || !type1 || !type2 || !agency || !ifany || !date2) {
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
      const awardRecord = new Award({
        empId: req.user.empId,
        award,
        type1,
        type2,
        agency,
        ifany,
        date2: new Date(date2),
        path: uploadStream.filename,
        academic_year,
        status: 'Pending' // Default status
      });

      await awardRecord.save();
      client.close();
      res.status(201).json({
        message: 'Award details submitted successfully',
        data: awardRecord
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error submitting Award details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to fetch awards with optional status filter
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    // If user is incharge, only show awards from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own awards
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const awards = await Award.find(query).lean();
    
    // Populate user details for each award
    const awardsWithUserDetails = await Promise.all(
      awards.map(async (award) => {
        const user = await User.findOne({ empId: award.empId }).select('name department').lean();
        return {
          ...award,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );
    
    res.json(awardsWithUserDetails);
  } catch (error) {
    console.error('Error fetching awards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update award status
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
    
    // If user is incharge, verify the award belongs to their department
    if (req.user.role === 'incharge') {
      const award = await Award.findById(id);
      if (!award) {
        return res.status(404).json({ error: 'Award not found' });
      }
      
      // Get the faculty member who submitted the award
      const faculty = await User.findOne({ empId: award.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update awards from your department' });
      }
    }
    
    const updatedAward = await Award.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!updatedAward) {
      return res.status(404).json({ error: 'Award not found' });
    }
    
    res.json({
      message: 'Award status updated successfully',
      data: updatedAward
    });
  } catch (error) {
    console.error('Error updating award status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to download award file
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

module.exports = router;