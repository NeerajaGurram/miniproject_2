const express = require('express');
const { uploadSingle, uploadMultiple, handleUploadError, deleteFile } = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Upload single file
router.post('/single', auth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload single file error:', error);
    res.status(500).json({ 
      error: 'File upload failed' 
    });
  }
});

// Upload multiple files
router.post('/multiple', auth, uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded' 
      });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype
    }));

    res.json({
      message: `${files.length} files uploaded successfully`,
      files
    });
  } catch (error) {
    console.error('Upload multiple files error:', error);
    res.status(500).json({ 
      error: 'File upload failed' 
    });
  }
});

// Delete file
router.delete('/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'general' } = req.query;
    
    const filePath = path.join('uploads', type, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found' 
      });
    }

    // Delete file from filesystem
    fs.unlinkSync(filePath);

    res.json({ 
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ 
      error: 'Failed to delete file' 
    });
  }
});

// Get file info
router.get('/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'general' } = req.query;
    
    const filePath = path.join('uploads', type, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found' 
      });
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);

    res.json({
      filename,
      originalName: name,
      path: filePath,
      size: stats.size,
      mimeType: getMimeType(ext),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ 
      error: 'Failed to get file info' 
    });
  }
});

// List files in directory
router.get('/list/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const dirPath = path.join('uploads', type);
    
    if (!fs.existsSync(dirPath)) {
      return res.json({
        files: [],
        totalPages: 0,
        currentPage: parseInt(page),
        total: 0
      });
    }

    const files = fs.readdirSync(dirPath)
      .filter(file => {
        const filePath = path.join(dirPath, file);
        return fs.statSync(filePath).isFile();
      })
      .map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file);
        const name = path.basename(file, ext);

        return {
          filename: file,
          originalName: name,
          path: filePath,
          size: stats.size,
          mimeType: getMimeType(ext),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => b.modifiedAt - a.modifiedAt);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = files.slice(startIndex, endIndex);

    res.json({
      files: paginatedFiles,
      totalPages: Math.ceil(files.length / limit),
      currentPage: parseInt(page),
      total: files.length
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ 
      error: 'Failed to list files' 
    });
  }
});

// Download file
router.get('/download/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'general' } = req.query;
    
    const filePath = path.join('uploads', type, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found' 
      });
    }

    const originalName = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename);
    
    res.download(filePath, `${originalName}${ext}`);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ 
      error: 'Failed to download file' 
    });
  }
});

// Helper function to get MIME type
function getMimeType(ext) {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain'
  };
  
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// Handle upload errors
router.use(handleUploadError);

module.exports = router; 