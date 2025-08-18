const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    // console.log('Authenticated user:', user);
    console.log('Empid:', user.empId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated. Please contact administrator.' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication failed.' 
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Faculty can only access their own data unless they're admin/HOD
const authorizeFaculty = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required.' 
    });
  }

  // Admin and HOD can access all data
  if (req.user.role === 'admin' || req.user.role === 'hod') {
    return next();
  }

  // Faculty can only access their own data
  if (req.user.role === 'faculty') {
    const requestedUserId = req.params.facultyId || req.params.id;
    if (requestedUserId && requestedUserId !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own data.' 
      });
    }
  }

  next();
};

// Check if user can modify research entry
const canModifyResearch = async (req, res, next) => {
  try {
    const Research = require('../models/Research');
    const researchId = req.params.id;
    
    if (!researchId) {
      return res.status(400).json({ 
        error: 'Research ID is required.' 
      });
    }

    const research = await Research.findById(researchId);
    
    if (!research) {
      return res.status(404).json({ 
        error: 'Research entry not found.' 
      });
    }

    // Admin and HOD can modify any research
    if (req.user.role === 'admin' || req.user.role === 'hod') {
      req.research = research;
      return next();
    }

    // Faculty can only modify their own research
    if (research.facultyId.toString() === req.user._id.toString()) {
      req.research = research;
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only modify your own research entries.' 
    });
  } catch (error) {
    console.error('Can modify research error:', error);
    res.status(500).json({ 
      error: 'Authorization check failed.' 
    });
  }
};

// Generate JWT token
const generateToken = (empId) => {
  return jwt.sign(
    { id: empId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  auth,
  authorize,
  authorizeFaculty,
  canModifyResearch,
  generateToken
}; 