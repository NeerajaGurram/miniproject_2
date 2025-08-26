const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Phd = require('../models/Phd');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'phds';

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
    const { uni, spe, guide, guidec, guided, type1, date1 } = req.body;
    if (!uni || !spe || !guide || !guidec || !guided || !type1 || !date1) {
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
      const phdRecord = new Phd({
        empId: req.user.empId,
        university: uni,
        special: spe,
        guide: guide,
        college: guidec,
        dept: guided,
        statuss: type1,
        sdate: new Date(date1),
        path: uploadStream.filename,
        academic_year
      });

      await phdRecord.save();
      client.close();
      res.status(201).json({
        message: 'PhD details submitted successfully',
        data: phdRecord
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error submitting PhD details:', error);
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

    // If user is incharge, only show phds from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own phds
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const phds = await Phd.find(query).lean();

    // Populate user details for each phd
    const phdsWithUserDetails = await Promise.all(
      phds.map(async (phd) => {
        const user = await User.findOne({ empId: phd.empId }).select('name department').lean();
        return {
          ...phd,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );

    res.json(phdsWithUserDetails);
  } catch (error) {
    console.error('Error fetching phds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update phd status
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

    // If user is incharge, verify the phd belongs to their department
    if (req.user.role === 'incharge') {
      const phd = await Phd.findById(id);
      if (!phd) {
        return res.status(404).json({ error: 'PhD not found' });
      }

      // Get the faculty member who submitted the phd
      const faculty = await User.findOne({ empId: phd.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update phds from your department' });
      }
    }

    // Prepare update object
    const updateData = { status };
    if (status === 'Rejected') {
      updateData.reason = reason;
    } else {
      updateData.reason = ''; // Clear reason if not rejected
    }

    const updatedPhd = await Phd.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPhd) {
      return res.status(404).json({ error: 'PhD not found' });
    }
    
    res.json({
      message: 'PhD status updated successfully',
      data: updatedPhd
    });
  } catch (error) {
    console.error('Error updating phd status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET route to fetch pending count for incharge users
router.get('/phd-counts', auth, async (req, res) => {
  try {
    // Only incharge users can access this endpoint
    if (req.user.role !== 'incharge') {
      return res.status(403).json({ error: 'Access denied. Only incharge users can view phd counts.' });
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

    // Build base phd query
    const phdQuery = {
      empId: { $in: facultyEmpIds }
    };

    // Count phds by status
    const [totalCount, acceptedCount, pendingCount, rejectedCount] = await Promise.all([
      Phd.countDocuments(phdQuery),
      Phd.countDocuments({ ...phdQuery, status: 'Accepted' }),
      Phd.countDocuments({ ...phdQuery, status: 'Pending' }),
      Phd.countDocuments({ ...phdQuery, status: 'Rejected' })
    ]);

    res.json({
      total: totalCount,
      accepted: acceptedCount,
      pending: pendingCount,
      rejected: rejectedCount
    });
    
  } catch (error) {
    console.error('Error fetching phd counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { auth } = require('../middleware/auth');
// const Phd = require('../models/Phd');
// const router = express.Router();
// const fs = require('fs');

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/phd');
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
//     const { uni, spe, guide, guidec, guided, type1, date1 } = req.body;
    
//     if (!uni || !spe || !guide || !guidec || !guided || !type1 || !date1) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: 'Document upload is required' });
//     }

//     // Create new PhD record
//     const phdRecord = new Phd({
//       empId: req.user.empId,
//       university: uni,
//       special: spe,
//       guide: guide,
//       college: guidec,
//       dept: guided,
//       statuss: type1,
//       sdate: new Date(date1),
//       path: req.file.path
//     });

//     await phdRecord.save();

//     res.status(201).json({
//       message: 'PhD details submitted successfully',
//       data: phdRecord
//     });
//   } catch (error) {
//     console.error('Error submitting PhD details:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;