const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  empId: { 
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['faculty', 'admin', 'incharge'], 
    default: 'faculty' 
  },
  department: { 
    type: String,
    enum: ['CSE', 'IT', 'ECE', 'EEE', 'EIE', 'ME', 'CE'],
    required: true,
    trim: true
  },
  designation: { 
    type: String,
    trim: true
  },
  phone: { 
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for research count
userSchema.virtual('researchCount', {
  ref: 'Research',
  localField: '_id',
  foreignField: 'facultyId',
  count: true
});

// Virtual for pending research count
userSchema.virtual('pendingResearchCount', {
  ref: 'Research',
  localField: '_id',
  foreignField: 'facultyId',
  count: true,
  match: { status: 'pending' }
});


// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  return userObject;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema); 