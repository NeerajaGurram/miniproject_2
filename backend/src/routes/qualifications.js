const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Qualification = require('../models/Qualification');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'qualifications';

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
    const { impro, special, type1, name, date1 } = req.body;
    if (!impro || !special || !type1 || !name || !date1) {
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
      const qualificationRecord = new Qualification({
        empId: req.user.empId,
        impro,
        special,
        type1,
        name,
        date1: new Date(date1),
        path: uploadStream.filename,
        academic_year
      });

      await qualificationRecord.save();
      client.close();
      res.status(201).json({ 
        message: 'Qualification record created successfully', 
        data: qualificationRecord 
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error creating qualification record:', error);
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

    // If user is incharge, only show qualifications from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own qualifications
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const qualifications = await Qualification.find(query).lean();

    // Populate user details for each qualification
    const qualificationsWithUserDetails = await Promise.all(
      qualifications.map(async (qualification) => {
        const user = await User.findOne({ empId: qualification.empId }).select('name department').lean();
        return {
          ...qualification,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );

    res.json(qualificationsWithUserDetails);
  } catch (error) {
    console.error('Error fetching qualifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update qualification status
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

    // If user is incharge, verify the qualification belongs to their department
    if (req.user.role === 'incharge') {
      const qualification = await Qualification.findById(id);
      if (!qualification) {
        return res.status(404).json({ error: 'Qualification not found' });
      }

      // Get the faculty member who submitted the qualification
      const faculty = await User.findOne({ empId: qualification.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update qualifications from your department' });
      }
    }

    const updatedQualification = await Qualification.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedQualification) {
      return res.status(404).json({ error: 'Qualification not found' });
    }
    
    res.json({
      message: 'Qualification status updated successfully',
      data: updatedQualification
    });
  } catch (error) {
    console.error('Error updating qualification status:', error);
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

    // Count pending qualifications for faculty in the incharge's department
    const pendingCount = await Qualification.countDocuments({
      empId: { $in: facultyEmpIds },
      status: 'Pending'
    });
    
    res.json({ count: pendingCount });
  } catch (error) {
    console.error('Error fetching pending qualifications count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// const express = require('express');
// const router = express.Router();
// const multer = require('multer')
// const path = require('path');
// const {auth} = require('../middleware/auth');
// const Qualification = require('../models/Qualification');
// const fs = require('fs');

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/qualifications');
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
//     try {
//         const {impro, special, type1, name, date1} = req.body;
//         if (!impro || !special || !type1 || !name || !date1){
//             return res.status(400).json({ error: 'All fields are required' });
//         }
//         if (!req.file){
//             return res.status(400).json({error: 'File is required'});
//         }
//         const qualificationRecord = new Qualification({
//             empId: req.user.empId,
//             impro,
//             special,
//             type1,
//             name,
//             date1: new Date(date1),
//             path: req.file.path,
//         });

//         await qualificationRecord.save();

//         res.status(201).json({ 
//             message: 'Qualification record created successfully', 
//             data: qualificationRecord 
//         });
//     } catch (error){
//         console.error('Error creating qualification record:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// module.exports = router;