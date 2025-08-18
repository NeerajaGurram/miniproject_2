const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Qualification = require('../models/Qualification');
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
  limits: { fileSize: 5 * 1024 * 1024 }
});

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

    uploadStream.on('finish', async (file) => {
      const qualificationRecord = new Qualification({
        empId: req.user.empId,
        impro,
        special,
        type1,
        name,
        date1: new Date(date1),
        path: uploadStream.filename
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
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
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