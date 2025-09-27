const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize, generateToken } = require('../middleware/auth');
const { uploadProfileImage, handleUploadError } = require('../middleware/upload');
const fs = require('fs'); // Added missing import for fs

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('empId')
    .trim()
    .notEmpty().withMessage('Employee ID is required')
    .isLength({ min: 5 }).withMessage('Employee ID must be at least 5 characters')
    .custom(async (empId) => {
      const existingUser = await User.findOne({ empId });
      if (existingUser) {
        throw new Error('Employee ID already in use');
      }
    }),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('empId')
    .trim()
    .notEmpty().withMessage('Employee ID is required')
    .isLength({ min: 5 }).withMessage('Employee ID must be at least 5 characters'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { empId, name, email, password, department, phone, designation } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }



    // Create new user
    const user = new User({
      empId,
      name,
      email,
      password,
      department,
      phone,
      role: 'faculty', // Default role for new registrations
      // branch: department, // Use department as branch for now
      designation: designation || 'Faculty' // Default designation
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed' 
    });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { empId, password } = req.body;

    // Find user by empId
    const user = await User.findOne({ empId });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid employee ID or password' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid employee ID or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed' 
    });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: user.getPublicProfile(),
      // stats: {
      //   totalResearch: user.researchCount || 0,
      //   pendingResearch: user.pendingResearchCount || 0
      // }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get profile' 
    });
  }
});

// Update user profile
router.put('/profile', auth, uploadProfileImage, async (req, res) => {
  try {
    const { name, department, designation, phone } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (department) updates.department = department;
    if (designation) updates.designation = designation;
    if (phone) updates.phone = phone;

    // Handle profile image upload
    if (req.file) {
      // Delete old profile image if exists
      if (req.user.profileImage) {
        const oldImagePath = req.user.profileImage;
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updates.profileImage = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile' 
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    res.json({ 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed' 
    });
  }
});

// Get all users (admin only)
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, branch, search } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (branch) filter.branch = branch;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        // { userId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to get users' 
    });
  }
});

// Update user status (admin only)
router.put('/users/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ 
      error: 'Failed to update user status' 
    });
  }
});

// Handle upload errors
router.use(handleUploadError);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// // Google OAuth login/signup
// router.post('/google', async (req, res) => {
//   try {
//     const { token } = req.body;

//     console.log('Received Google auth request');
    
//     if (!token) {
//       console.error('No token provided');
//       return res.status(400).json({ error: 'Google token is required' });
//     }

//     // Verify Google token
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID
//     });

//     const payload = ticket.getPayload();
//     // console.log('Google payload:', payload);
    
//     const { email, name, picture, sub: googleId } = payload;

//     if (!email) {
//       return res.status(400).json({ error: 'Email is required from Google' });
//     }

//     // Find user by email first (primary lookup)
//     let user = await User.findOne({ 
//       $or: [
//         { email: email },
//         { googleId: googleId }
//       ]
//     });

//     if (user) {
//       console.log('Found existing user:', user.email);
      
//       // Update Google ID if not set
//       if (!user.googleId) {
//         user.googleId = googleId;
//         user.profileImage = picture;
//         await user.save();
//       }
      
//       // If user exists but is deactivated
//       if (!user.isActive) {
//         return res.status(401).json({ 
//           error: 'Account is deactivated. Please contact administrator.' 
//         });
//       }
//     } else {
//       console.log('Creating new user for:', email);
      
//       // Create new user with Google auth
//       const empIdBase = email.split('@')[0];
//       let empId = `google_${empIdBase}`;
//       let counter = 1;
      
//       // Ensure unique empId
//       while (await User.findOne({ empId })) {
//         empId = `google_${empIdBase}_${counter}`;
//         counter++;
//       }

//       user = new User({
//         email,
//         name: name || email.split('@')[0],
//         googleId,
//         profileImage: picture,
//         emailVerified: true,
//         empId: empId,
//         department: 'General',
//         designation: 'Faculty',
//         isActive: true,
//         password: undefined // No password for Google users
//       });
      
//       await user.save();
//       console.log('Created new user:', user.email);
//     }

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate JWT token
//     const authToken = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     console.log('Google auth successful for:', user.email);
    
//     res.json({
//       message: 'Google authentication successful',
//       user: user.getPublicProfile(),
//       token: authToken
//     });

//   } catch (error) {
//     console.error('Google auth error:', error);
    
//     if (error.message.includes('Token used too late')) {
//       return res.status(400).json({ error: 'Google token has expired. Please try again.' });
//     }
    
//     res.status(400).json({ 
//       error: 'Google authentication failed',
//       details: error.message 
//     });
//   }
// });
// Google OAuth login/signup
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    console.log('Received Google auth request');
    
    if (!token) {
      console.error('No token provided');
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google' });
    }

    // Find existing user by email
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });

    if (!user) {
      console.log('No user found for email:', email);
      return res.status(404).json({ 
        error: 'No account found with this email. Please contact administrator for registration.' 
      });
    }

    console.log('Found existing user:', user.email);
    
    // Update Google ID if not set
    if (!user.googleId) {
      user.googleId = googleId;
      user.profileImage = picture;
      await user.save();
    }
    
    // If user exists but is deactivated
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated. Please contact administrator.' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const authToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Google auth successful for:', user.email);
    
    res.json({
      message: 'Google authentication successful',
      user: user.getPublicProfile(),
      token: authToken
    });

  } catch (error) {
    console.error('Google auth error:', error);
    
    if (error.message.includes('Token used too late')) {
      return res.status(400).json({ error: 'Google token has expired. Please try again.' });
    }
    
    res.status(400).json({ 
      error: 'Google authentication failed',
      details: error.message 
    });
  }
});

module.exports = router; 