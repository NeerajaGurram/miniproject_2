const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/seminars',
    'uploads/journals',
    'uploads/books',
    'uploads/phd',
    'uploads/awards',
    'uploads/patents',
    'uploads/visits',
    'uploads/consultancy',
    'uploads/infrastructure',
    'uploads/grants',
    'uploads/profiles'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || req.params.type || 'general';
    const uploadPath = `uploads/${type}`;
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    // Sanitize filename
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  // Additional check for common file types
  const isAllowedMimeType = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ].includes(file.mimetype);
  
  if (mimetype && extname && isAllowedMimeType) {
    return cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.source}`));
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter
});

// Single file upload
const uploadSingle = upload.single('file');

// Multiple files upload
const uploadMultiple = upload.array('files', 5);

// Research attachments upload
const uploadResearchAttachments = upload.array('attachments', 5);

// Profile image upload
const uploadProfileImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/profiles');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for profile images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'));
    }
  }
}).single('profileImage');

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files. Maximum 5 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field.'
      });
    }
    return res.status(400).json({
      error: 'File upload error: ' + error.message
    });
  }
  
  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({
      error: error.message
    });
  }
  
  console.error('Upload error:', error);
  res.status(500).json({
    error: 'File upload failed.'
  });
};

// Utility function to delete file
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Utility function to get file info
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date()
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadResearchAttachments,
  uploadProfileImage,
  handleUploadError,
  deleteFile,
  getFileInfo
}; 