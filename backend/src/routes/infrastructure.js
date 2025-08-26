const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Infrastructure = require('../models/Infrastructure');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'infrastructures'; 

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

router.post('/', auth, upload.single('file'), async(req, res) => {
  try {
    const {title, title1, comment, title2, date2} = req.body;
    if (!title || !title1 || !title2 ||!comment || !date2){
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!req.file){
      return res.status(400).json({error: 'File is required'});
    }

    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db);

    const uploadStream = bucket.openUploadStream(`${req.user.empId}_${Date.now()}_${req.file.originalname}`);
    uploadStream.end(req.file.buffer);

    const academic_year = getAcademicYear();
    uploadStream.on('finish', async (file) => {
      const infrastructureRecord = new Infrastructure({
        empId: req.user.empId,
        title,
        title1,
        comment,
        title2,
        date2: new Date(date2),
        path: uploadStream.filename,
        academic_year
      });

      await infrastructureRecord.save();
      client.close();
      res.status(201).json({
        message: 'Infrastructure details created successfully',
        data: infrastructureRecord
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error submitting Infrastructure details:', error);
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

    // If user is incharge, only show infrastructures from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own infrastructures
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const infrastructures = await Infrastructure.find(query).lean();

    // Populate user details for each infrastructure
    const infrastructuresWithUserDetails = await Promise.all(
      infrastructures.map(async (infrastructure) => {
        const user = await User.findOne({ empId: infrastructure.empId }).select('name department').lean();
        return {
          ...infrastructure,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );

    res.json(infrastructuresWithUserDetails);
  } catch (error) {
    console.error('Error fetching infrastructures:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update infrastructure status
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

    // If user is incharge, verify the infrastructure belongs to their department
    if (req.user.role === 'incharge') {
      const infrastructure = await Infrastructure.findById(id);
      if (!infrastructure) {
        return res.status(404).json({ error: 'Infrastructure not found' });
      }

      // Get the faculty member who submitted the infrastructure
      const faculty = await User.findOne({ empId: infrastructure.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update infrastructures from your department' });
      }
    }

    // Prepare update object
    const updateData = { status };
    if (status === 'Rejected') {
      updateData.reason = reason;
    } else {
      updateData.reason = ''; // Clear reason if not rejected
    }

    const updatedInfrastructure = await Infrastructure.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedInfrastructure) {
      return res.status(404).json({ error: 'Infrastructure not found' });
    }
    
    res.json({
      message: 'Infrastructure status updated successfully',
      data: updatedInfrastructure
    });
  } catch (error) {
    console.error('Error updating infrastructure status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to fetch pending count for incharge users
router.get('/infrastructure-counts', auth, async (req, res) => {
  try {
    // Only incharge users can access this endpoint
    if (req.user.role !== 'incharge') {
      return res.status(403).json({ error: 'Access denied. Only incharge users can view infrastructure counts.' });
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

    // Build base infrastructure query
    const infrastructureQuery = {
      empId: { $in: facultyEmpIds }
    };

    // Count infrastructures by status
    const [totalCount, acceptedCount, pendingCount, rejectedCount] = await Promise.all([
      Infrastructure.countDocuments(infrastructureQuery),
      Infrastructure.countDocuments({ ...infrastructureQuery, status: 'Accepted' }),
      Infrastructure.countDocuments({ ...infrastructureQuery, status: 'Pending' }),
      Infrastructure.countDocuments({ ...infrastructureQuery, status: 'Rejected' })
    ]);

    res.json({
      total: totalCount,
      accepted: acceptedCount,
      pending: pendingCount,
      rejected: rejectedCount
    });
    
  } catch (error) {
    console.error('Error fetching infrastructure counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const {auth} = require('../middleware/auth');
// const path = require('path');
// const Infrastructure = require('../models/Infrastructure');
// const router = express.Router();

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/infrastructure');
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

// router.post('/', auth, upload.single('file'), async(req, res) => {
//     try{
//         const {title, title1, comment, title2, date2} = req.body;
//         if (!title || !title1 || !title2 ||!comment || !date2){
//             res.status(400).json({
//                 error: 'All fields are required'
//             });
//         }
//         if (!req.file){
//             res.status(400).json({error: 'File is required'});
//         }

//         const infrastructureRecord = new Infrastructure({
//             empId: req.user.empId,
//             title,
//             title1,
//             comment,
//             title2,
//             date2: new Date(date2),
//             path: req.file.path
//         });

//         await infrastructureRecord.save();

//         res.status(201).json({
//             message: 'Infrastructure details created successfully',
//             data: infrastructureRecord
//         });
//     } catch (error) {
//     console.error('Error submitting Patent details:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;