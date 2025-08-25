const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Book = require('../models/Book');
const User = require('../models/User');
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

    const academic_year = getAcademicYear();
    uploadStream.on('finish', async (file) => {
      const bookRecord = new Book({
        empId: req.user.empId,
        book,
        type1,
        publisher,
        pub1: publ,
        sdate: new Date(date1),
        path: uploadStream.filename,
        academic_year
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
    const { status } = req.query;
    let query = {};

    // If user is incharge, only show books from their department
    if (req.user.role === 'incharge') {
      // Get faculty in the same department as incharge
      const facultyInDepartment = await User.find({ 
        department: req.user.department, 
        role: 'faculty' 
      }).select('empId');
      
      const facultyEmpIds = facultyInDepartment.map(f => f.empId);
      query.empId = { $in: facultyEmpIds };
    } else if (req.user.role === 'faculty') {
      // Faculty can only see their own books
      query.empId = req.user.empId;
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const books = await Book.find(query).lean();

    // Populate user details for each book
    const booksWithUserDetails = await Promise.all(
      books.map(async (book) => {
        const user = await User.findOne({ empId: book.empId }).select('name department').lean();
        return {
          ...book,
          employee: user ? user.name : 'Unknown',
          department: user ? user.department : 'Unknown'
        };
      })
    );

    res.json(booksWithUserDetails);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update book status
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

    // If user is incharge, verify the book belongs to their department
    if (req.user.role === 'incharge') {
      const book = await Book.findById(id);
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      // Get the faculty member who submitted the book
      const faculty = await User.findOne({ empId: book.empId });
      if (!faculty || faculty.department !== req.user.department) {
        return res.status(403).json({ error: 'You can only update books from your department' });
      }
    }
    
    // Prepare update object
    const updateData = { status };
    if (status === 'Rejected') {
      updateData.reason = reason;
    } else {
      updateData.reason = ''; // Clear reason if not rejected
    }

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json({
      message: 'Book status updated successfully',
      data: updatedBook
    });
  } catch (error) {
    console.error('Error updating book status:', error);
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

    // Count pending books for faculty in the incharge's department
    const pendingCount = await Book.countDocuments({
      empId: { $in: facultyEmpIds },
      status: 'Pending'
    });
    
    res.json({ count: pendingCount });
  } catch (error) {
    console.error('Error fetching pending books count:', error);
    res.status(500).json({ error: 'Internal server error' });
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
//   limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
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