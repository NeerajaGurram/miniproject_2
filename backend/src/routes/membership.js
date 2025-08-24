const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Membership = require('../models/Membership');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'memberships';

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
    const { member, body, date2, term } = req.body;
    if (!member || !body || !date2 || !term) {
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
      const membershipRecord = new Membership({
        empId: req.user.empId,
        member,
        body,
        date2: new Date(date2),
        term,
        path: uploadStream.filename,
        academic_year
      });

      await membershipRecord.save();
      client.close();
      res.status(201).json({
        message: 'Membership details submitted successfully',
        data: membershipRecord
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error submitting Membership details:', error);
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

    // If user is incharge, only show memberships from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own memberships
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const memberships = await Membership.find(query).lean();

    // Populate user details for each membership
    const membershipsWithUserDetails = await Promise.all(
      memberships.map(async (membership) => {
        const user = await User.findOne({ empId: membership.empId }).select('name department').lean();
        return {
          ...membership,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );

    res.json(membershipsWithUserDetails);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update membership status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log('Update status request by user:', status);
    // Validate status
    if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check if user has permission to update status (admin or incharge)
    if (!['admin', 'incharge'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // If user is incharge, verify the membership belongs to their department
    if (req.user.role === 'incharge') {
      const membership = await Membership.findById(id);
      if (!membership) {
        return res.status(404).json({ error: 'Membership not found' });
      }

      // Get the faculty member who submitted the membership
      const faculty = await User.findOne({ empId: membership.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update memberships from your department' });
      }
    }

    const updatedMembership = await Membership.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    
    res.json({
      message: 'Membership status updated successfully',
      data: updatedMembership
    });
  } catch (error) {
    console.error('Error updating membership status:', error);
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

    // Count pending memberships for faculty in the incharge's department
    const pendingCount = await Membership.countDocuments({
      empId: { $in: facultyEmpIds },
      status: 'Pending'
    });
    
    res.json({ count: pendingCount });
  } catch (error) {
    console.error('Error fetching pending memberships count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const {auth} = require('../middleware/auth');
// const Membership = require('../models/Membership');
// const path = require('path');
// const router = express.Router();

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/membership');
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

// router.post('/', auth, upload.single('file'), async (req, res) => {
//     try{
//         const {member, body, date2, term} = req.body;
//         if (!member || !body || !date2 || !term) {
//             return res.status(400).json({ error: 'All fields are required' });
//         }
//         if (!req.file) {
//             return res.status(400).json({ error: 'File is required' });
//         }

//         const membershipRecord = new Membership({
//             empId: req.user.empId,
//             member,
//             body,
//             date2: new Date(date2),
//             term,
//             path: req.file.path
//         });

//         await membershipRecord.save();

//         res.status(201).json({
//             message: 'Membership details submitted successfully',
//             data: membershipRecord
//         });
//     } catch (error) {
//         console.error('Error submitting Membership details:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// module.exports = router;
