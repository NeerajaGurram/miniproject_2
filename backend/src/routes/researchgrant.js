const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const ResearchGrant = require('../models/ResearchGrant');
const User = require('../models/User');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'researchgrants'; 

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
  limits: { fileSize: 50 * 1024 * 1024 } // 5MB limit
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
    const {title, duration, agency, letter, date1, amount, type1, type2, comment} = req.body;
    if (!title || !duration || !agency || !letter || !date1 || !amount || !type1 || !type2) {
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
      const researchgrantRecord = new ResearchGrant({
        empId: req.user.empId,
        title,
        duration,
        agency,
        letter,
        date1: new Date(date1),
        amount,
        type1,
        type2,
        comment,
        path: uploadStream.filename,
        academic_year
      });

      await researchgrantRecord.save();
      client.close();
      res.status(201).json({ 
        message: 'Research grant created successfully', 
        data: researchgrantRecord 
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error creating research grant:', error);
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

    // If user is incharge, only show researchgrants from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own research grants
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const researchgrants = await ResearchGrant.find(query).lean();

    // Populate user details for each research grant
    const researchgrantsWithUserDetails = await Promise.all(
      researchgrants.map(async (researchgrant) => {
        const user = await User.findOne({ empId: researchgrant.empId }).select('name department').lean();
        return {
          ...researchgrant,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );

    res.json(researchgrantsWithUserDetails);
  } catch (error) {
    console.error('Error fetching research grants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update research grant status
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

    // If user is incharge, verify the research grant belongs to their department
    if (req.user.role === 'incharge') {
      const researchgrant = await ResearchGrant.findById(id);
      if (!researchgrant) {
        return res.status(404).json({ error: 'Research grant not found' });
      }

      // Get the faculty member who submitted the research grant
      const faculty = await User.findOne({ empId: researchgrant.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update research grants from your department' });
      }
    }

    // Prepare update object
    const updateData = { status };
    if (status === 'Rejected') {
      updateData.reason = reason;
    } else {
      updateData.reason = ''; // Clear reason if not rejected
    }

    const updatedResearchGrant = await ResearchGrant.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedResearchGrant) {
      return res.status(404).json({ error: 'Research grant not found' });
    }
    
    res.json({
      message: 'Research grant status updated successfully',
      data: updatedResearchGrant
    });
  } catch (error) {
    console.error('Error updating research grant status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to fetch pending count for incharge users
router.get('/researchgrant-counts', auth, async (req, res) => {
  try {
    // Only incharge users can access this endpoint
    if (req.user.role !== 'incharge') {
      return res.status(403).json({ error: 'Access denied. Only incharge users can view researchgrant counts.' });
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

    // Build base researchgrant query
    const researchgrantQuery = {
      empId: { $in: facultyEmpIds }
    };

    // Count researchgrants by status
    const [totalCount, acceptedCount, pendingCount, rejectedCount] = await Promise.all([
      ResearchGrant.countDocuments(researchgrantQuery),
      ResearchGrant.countDocuments({ ...researchgrantQuery, status: 'Accepted' }),
      ResearchGrant.countDocuments({ ...researchgrantQuery, status: 'Pending' }),
      ResearchGrant.countDocuments({ ...researchgrantQuery, status: 'Rejected' })
    ]);

    res.json({
      total: totalCount,
      accepted: acceptedCount,
      pending: pendingCount,
      rejected: rejectedCount
    });
    
  } catch (error) {
    console.error('Error fetching researchgrant counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// const express =require('express');
// const multer = require('multer');
// const fs =require('fs');
// const {auth} = require('../middleware/auth');
// const path = require('path');
// const ResearchGrant = require('../models/ResearchGrant');
// const router = express.Router();

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/researchgrants');
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
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });

// router.post('/', auth, upload.single('file'), async(req, res) => {
//     try{
//         const {title, duration, agency, letter, date1, amount, type1, type2, comment} = req.body;
//         if (!title || !duration || !agency || !letter || !date1 || !amount || !type1 || !type2) {
//             return res.status(400).json({ error: 'All fields are required' });
//         }
//         if (!req.file) {
//             return res.status(400).json({ error: 'Document upload is required' });
//         }

//         const researchgrantRecord = new ResearchGrant({
//             empId: req.user.empId,
//             title,
//             duration,
//             agency,
//             letter,
//             date1: new Date(date1),
//             amount,
//             type1,
//             type2,
//             comment,
//             path: req.file.path
//         });

//         await researchgrantRecord.save();
//         res.status(201).json({ message: 'Research grant created successfully', data: researchgrantRecord });
//     } catch (error) {
//         console.error('Error creating research grant:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// module.exports = router;