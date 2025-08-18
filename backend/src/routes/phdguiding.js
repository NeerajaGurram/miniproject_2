const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const PhdGuiding = require('../models/PhdGuiding');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'phdguidings';

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
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { uni, spe, guide, date1 } = req.body;
    if (!uni || !spe || !guide || !date1) {
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

    uploadStream.on('finish', async (file) => {
      const phdguidingRecord = new PhdGuiding({
        empId: req.user.empId,
        university: uni,
        special: spe,
        name: guide,
        sdate: new Date(date1),
        path: uploadStream.filename
      });

      await phdguidingRecord.save();
      client.close();
      res.status(201).json({
        message: 'PhDGuiding details submitted successfully',
        data: phdguidingRecord
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ error: 'File upload error' });
    });

  } catch (error) {
    console.error('Error submitting PhDGuiding details:', error);
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

module.exports = router;
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { auth } = require('../middleware/auth');
// const PhdGuiding = require('../models/PhdGuiding');
// const router = express.Router();
// const fs = require('fs');

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/phdguiding');
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

// // Submit PhDGuiding details
// router.post('/', auth, upload.single('file'), async (req, res) => {
//   try {
//     // Validate request body
//     const { uni, spe, guide, date1 } = req.body;

//     if (!uni || !spe || !guide || !date1) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: 'Document upload is required' });
//     }

//     // Create new PhDGuiding record
//     const phdguidingRecord = new PhdGuiding({
//       empId: req.user.empId,
//       university: uni,
//       special: spe,
//       guide: guide,
//       sdate: new Date(date1),
//       path: req.file.path
//     });

//     await phdguidingRecord.save();

//     res.status(201).json({
//       message: 'PhDGuiding details submitted successfully',
//       data: phdguidingRecord
//     });
//   } catch (error) {
//     console.error('Error submitting PhDGuiding details:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;