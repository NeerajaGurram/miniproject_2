const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Journal = require('../models/Journal');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'journals'; 

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

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, name, issuedate, jnumber, pnumber, pos, issn, impact, type1, scopus, pdate } = req.body;

    if (!title || !name || !issuedate || !jnumber || !pnumber || !pos || !issn || !impact || !type1 || !scopus || !pdate) {
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
      const journalRecord = new Journal({
        empId: req.user.empId,
        title,
        name,
        issuedate: new Date(issuedate),
        jnumber,
        pnumber,
        pos,
        issn,
        impact,
        type1,
        scopus,
        pdate: new Date(pdate),
        path: uploadStream.filename,
        academic_year
      });

      await journalRecord.save();
      client.close();
      res.status(201).json({
        message: 'Journal details submitted successfully',
        data: journalRecord
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error submitting Journal details:', error);
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

    // If user is incharge, only show journals from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own journals
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const journals = await Journal.find(query).lean();

    // Populate user details for each journal
    const journalsWithUserDetails = await Promise.all(
      journals.map(async (journal) => {
        const user = await User.findOne({ empId: journal.empId }).select('name department').lean();
        return {
          ...journal,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );

    res.json(journalsWithUserDetails);
  } catch (error) {
    console.error('Error fetching journals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update journal status
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

    // If user is incharge, verify the journal belongs to their department
    if (req.user.role === 'incharge') {
      const journal = await Journal.findById(id);
      if (!journal) {
        return res.status(404).json({ error: 'Journal not found' });
      }

      // Get the faculty member who submitted the journal
      const faculty = await User.findOne({ empId: journal.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update journals from your department' });
      }
    }

    // Prepare update object
    const updateData = { status };
    if (status === 'Rejected') {
      updateData.reason = reason;
    } else {
      updateData.reason = ''; // Clear reason if not rejected
    }

    const updatedJournal = await Journal.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedJournal) {
      return res.status(404).json({ error: 'Journal not found' });
    }
    
    res.json({
      message: 'Journal status updated successfully',
      data: updatedJournal
    });
  } catch (error) {
    console.error('Error updating journal status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to fetch pending count for incharge users
router.get('/journal-counts', auth, async (req, res) => {
  try {
    // Only incharge users can access this endpoint
    if (req.user.role !== 'incharge') {
      return res.status(403).json({ error: 'Access denied. Only incharge users can view journal counts.' });
    }

    const { branch } = req.query;

    // Build base query for faculty in the same department
    const facultyQuery = {
      department: req.user.department,
      role: 'faculty'
    };

    // If branch is provided, add it to the query
    if (branch) {
      facultyQuery.branch = branch;
    }

    // Get faculty empIds
    const facultyInDepartment = await User.find(facultyQuery).select('empId');
    const facultyEmpIds = facultyInDepartment.map(f => f.empId);

    // Build base journal query
    const journalQuery = {
      empId: { $in: facultyEmpIds }
    };

    // Count journals by status
    const [totalCount, acceptedCount, pendingCount, rejectedCount] = await Promise.all([
      Journal.countDocuments(journalQuery),
      Journal.countDocuments({ ...journalQuery, status: 'Accepted' }),
      Journal.countDocuments({ ...journalQuery, status: 'Pending' }),
      Journal.countDocuments({ ...journalQuery, status: 'Rejected' })
    ]);

    res.json({
      total: totalCount,
      accepted: acceptedCount,
      pending: pendingCount,
      rejected: rejectedCount
    });
    
  } catch (error) {
    console.error('Error fetching journal counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { auth } = require('../middleware/auth');
// const Journal = require('../models/Journal');
// const router = express.Router();
// const fs = require('fs');

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/journals');
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

// // Submit Journal details
// router.post('/', auth, upload.single('file'), async (req, res) => {
//   try {
//     // Validate request body
//     const { title, name, issuedate, jnumber, pnumber, pos, issn, impact, type1, scopus, pdate } = req.body;

//     if (!title || !name || !issuedate || !jnumber || !pnumber || !pos || !issn || !impact || !type1 || !scopus || !pdate) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: 'Document upload is required' });
//     }

//     // Create new Journal record
//     const journalRecord = new Journal({
//       empId: req.user.empId,
//       title,
//       name,
//       issuedate: new Date(issuedate),
//       jnumber,
//       pnumber,
//       pos,
//       issn,
//       impact,
//       type1,
//       scopus,
//       pdate: new Date(pdate),
//       path: req.file.path
//     });

//     await journalRecord.save();

//     res.status(201).json({
//       message: 'Journal details submitted successfully',
//       data: journalRecord
//     });
//   } catch (error) {
//     console.error('Error submitting Journal details:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
    
// module.exports = router;