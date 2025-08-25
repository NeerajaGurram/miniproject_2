const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const JournalEdited = require('../models/JournalEdited');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'journaledited';

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

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { journal, pub1, paper, type1, publisher, sdate } = req.body;
    if (!journal || !pub1 || !paper || !type1 || !publisher || !sdate) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Document upload is required' });
    }

    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db);

    const uploadStream = bucket.openUploadStream(`${req.user.empId}_${Date.now()}_${req.file.originalname}`);
    uploadStream.end(req.file.buffer);

    const academic_year = getAcademicYear();
    uploadStream.on('finish', async (file) => {
      const journalEditedRecord = new JournalEdited({
        empId: req.user.empId,
        journal,
        pub1,
        paper,
        type1,
        publisher,
        sdate: new Date(sdate),
        path: uploadStream.filename,
        academic_year
      });

      await journalEditedRecord.save();
      client.close();
      res.status(201).json({
        message: 'Journal Edited details submitted successfully',
        data: journalEditedRecord
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error submitting Journal Edited details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // If user is incharge, only show journals edited from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own journals edited
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const journalsEdited = await JournalEdited.find(query).lean();

    // Populate user details for each journal
    const journalsEditedWithUserDetails = await Promise.all(
      journalsEdited.map(async (journaledited) => {
        const user = await User.findOne({ empId: journaledited.empId }).select('name department').lean();
        return {
          ...journaledited,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );

    res.json(journalsEditedWithUserDetails);
  } catch (error) {
    console.error('Error fetching journals edited:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update journal edited status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    console.log('Update status request by user:', status);
    // Validate status
    if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check if user has permission to update status (admin or incharge)
    if (!['admin', 'incharge'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // If rejected, require a reason
    if (status === 'Rejected' && !reason) {
      return res.status(400).json({ error: 'Reason is required for rejection' });
    }

    // If user is incharge, verify the journal edited belongs to their department
    if (req.user.role === 'incharge') {
      const journaledited = await JournalEdited.findById(id);
      if (!journaledited) {
        return res.status(404).json({ error: 'Journal Edited not found' });
      }

      // Get the faculty member who submitted the journal edited
      const faculty = await User.findOne({ empId: journaledited.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update journals edited from your department' });
      }
    }
    
    // Prepare update object
    const updateData = { status };
    if (status === 'Rejected') {
      updateData.reason = reason;
    } else {
      updateData.reason = ''; // Clear reason if not rejected
    }

    const updatedJournalEdited = await JournalEdited.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedJournalEdited) {
      return res.status(404).json({ error: 'Journal Edited not found' });
    }
    
    res.json({
      message: 'Journal Edited status updated successfully',
      data: updatedJournalEdited
    });
  } catch (error) {
    console.error('Error updating journal edited status:', error);
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

    // Count pending journals edited for faculty in the incharge's department
    const pendingCount = await JournalEdited.countDocuments({
      empId: { $in: facultyEmpIds },
      status: 'Pending'
    });
    
    res.json({ count: pendingCount });
  } catch (error) {
    console.error('Error fetching pending journals edited count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { auth } = require('../middleware/auth');
// const JournalEdited = require('../models/JournalEdited');
// const router = express.Router();
// const fs = require('fs');

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/journal-edited');
//     fs.mkdirSync(dir, { recursive: true }); // Create directory if it doesn't exist
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `${req.user.empId}${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// // File filter to allow only PDFs
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/pdf') {
//     cb(null, true);
//   } else {
//     cb(new Error('Only PDF files are allowed'), false);
//   }
// };

// const upload = multer({ 
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
// });

// // Submit PhD details
// router.post('/', auth, upload.single('file'), async (req, res) => {
//   try {
//     // Validate request body
//     const { journal, pub1, paper, type1, publisher, sdate } = req.body;

//     if (!journal || !pub1 || !paper || !type1 || !publisher || !sdate) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: 'Document upload is required' });
//     }

//     // Create new Journal Edited record
//     const journalEditedRecord = new JournalEdited({
//       empId: req.user.empId,
//       journal,
//       pub1,
//       paper,
//       type1,
//       publisher,
//       sdate: new Date(sdate),
//       path: req.file.path
//     });

//     await journalEditedRecord.save();

//     res.status(201).json({
//       message: 'Journal Edited details submitted successfully',
//       data: journalEditedRecord
//     });
//   } catch (error) {
//     console.error('Error submitting Journal Edited details:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;