const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Book = require('../models/Book');
const router = express.Router();
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'books';

// Configure multer to use memory storage
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Submit Book details
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    // Validate request body
    const { book, type1, publisher, publ, date1 } = req.body;

    if (!book || !type1 || !publisher || !publ || !date1) {
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
      const bookRecord = new Book({
        empId: req.user.empId,
        book,
        type1,
        publisher,
        pub1: publ,
        sdate: new Date(date1),
        path: uploadStream.filename
      });

      await bookRecord.save();
      client.close();

      res.status(201).json({
        message: 'Book details submitted successfully',
        data: {
          ...bookRecord.toObject(),
          fileUrl: `/api/books/file/${uploadStream.filename}`
        }
      });
    });

    uploadStream.on('error', err => {
      client.close();
      res.status(500).json({ 
        error: 'File upload error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

  } catch (error) {
    console.error('Error submitting Book details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// File download endpoint
router.get('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db);

    const downloadStream = bucket.openDownloadStreamByName(filename);

    res.setHeader('Content-Type', 'application/pdf');
    downloadStream.pipe(res);
    
    downloadStream.on('end', () => client.close());
    downloadStream.on('error', (err) => {
      client.close();
      res.status(404).json({ 
        error: 'File not found',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all books for a user
router.get('/', auth, async (req, res) => {
  try {
    const books = await Book.find({ empId: req.user.empId });
    res.json(books);
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single book by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findOne({ 
      _id: req.params.id,
      empId: req.user.empId 
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const { auth } = require('../middleware/auth');
// const Book = require('../models/Book');
// const router = express.Router();
// const fs = require('fs');

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Ensure the uploads directory exists
//     const dir = path.join(__dirname, '../../uploads/books');
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

// // Submit Journal details
// router.post('/', auth, upload.single('file'), async (req, res) => {
//   try {
//     // Validate request body
//     const { book, type1, publisher, publ, date1 } = req.body;

//     if (!book || !type1 || !publisher || !publ || !date1) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: 'Document upload is required' });
//     }

//     // Create new Book record
//     const bookRecord = new Book({
//       empId: req.user.empId,
//       book,
//       type1,
//       publisher,
//       pub1: publ, 
//       sdate: new Date(date1),
//       path: req.file.path
//     });

//     await bookRecord.save();

//     res.status(201).json({
//       message: 'Book details submitted successfully',
//       data: {
//         ...bookRecord.toObject(),
//         // Return public URL for the file
//         fileUrl: `/uploads/books/${req.file.filename}`
//       }
//     });
//   } catch (error) {
//     console.error('Error submitting Book details:', error);
//     res.status(500).json({ 
//       error: 'Internal server error',
//       message: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // // Get all books for a user
// // router.get('/', auth, async (req, res) => {
// //   try {
// //     const books = await Book.find({ empId: req.user.empId });
// //     res.json(books);
// //   } catch (error) {
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // });

// // // Get single book by ID
// // router.get('/:id', auth, async (req, res) => {
// //   try {
// //     const book = await Book.findOne({ 
// //       _id: req.params.id,
// //       empId: req.user.empId 
// //     });
    
// //     if (!book) {
// //       return res.status(404).json({ error: 'Book not found' });
// //     }
    
// //     res.json(book);
// //   } catch (error) {
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // });

// module.exports = router;