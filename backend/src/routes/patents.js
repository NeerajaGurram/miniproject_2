const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Patent = require('../models/Patent');
const router = express.Router();

const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'patents'; // Change to your DB name

// Use multer memory storage
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
};
const upload = multer({
    storage,
    fileFilter,
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

// Submit Patent details
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        const { title, fnum, date1, status1 } = req.body;
        if (!title || !fnum || !date1 || !status1) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Document upload is required' });
        }
        // Save PDF to GridFS
        const client = new MongoClient(mongoUrl);
        await client.connect();
        const db = client.db(dbName);
        const bucket = new GridFSBucket(db);

        const uploadStream = bucket.openUploadStream(`${req.user.empId}_${Date.now()}_${req.file.originalname}`);
        uploadStream.end(req.file.buffer);

        const academic_year = getAcademicYear();
        uploadStream.on('finish', async (file) => {
            // Store file ID or filename as path
            const patentRecord = new Patent({
                empId: req.user.empId,
                title,
                fnum,
                date1: new Date(date1),
                status1,
                path: uploadStream.filename, // or file._id.toString() - up to your preference
                academic_year
            });
            await patentRecord.save();
            client.close();
            res.status(201).json({
                message: 'Patent details submitted successfully',
                data: patentRecord
            });
        });

        uploadStream.on('error', err => {
            client.close();
            res.status(500).json({ error: 'File upload error' });
        });

    } catch (error) {
        console.error('Error submitting Patent details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to retrieve PDF using path field (filename or file ID)
router.get('/file/:path', async (req, res) => {
    const { path } = req.params;
    try {
        const client = new MongoClient(mongoUrl);
        await client.connect();
        const db = client.db(dbName);
        const bucket = new GridFSBucket(db);

        // You may use filename or file ID for retrieval, here's for filename:
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

// Get all patents for a user
router.get('/', auth, async (req, res) => {
  try {
    const patents = await Patent.find({ empId: req.user.empId });
    res.json(patents);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { auth } = require('../middleware/auth');
// const Patent = require('../models/Patent');
// const router = express.Router();
// const fs = require('fs');

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/patents');
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

// // Submit Patent details
// router.post('/', auth, upload.single('file'), async (req, res) => {
//   try {
//     // Validate request body
//     const { title, fnum, date1, status1 } = req.body;

//     if (!title || !fnum || !date1 || !status1) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: 'Document upload is required' });
//     }

//     // Create new Patent record
//     const patentRecord = new Patent({
//       empId: req.user.empId,
//       title,
//       fnum,
//       date1: new Date(date1),
//       status1,
//       path: req.file.path
//     });

//     await patentRecord.save();

//     res.status(201).json({
//       message: 'Patent details submitted successfully',
//       data: patentRecord
//     });

//   } catch (error) {
//     console.error('Error submitting Patent details:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;
