// models/Seminar.js
const mongoose = require('mongoose');
const SeminarSchema = new mongoose.Schema({
  empId: { 
    type: String, 
    ref: 'User', 
    required: true,
    maxlength: 25
  },
  title: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type1: {
    type: String,
    required: true,
    enum: ['Seminar', 'Conference', 'Workshop', 'FDP', 'Guest Lecture']
  }, // Seminar/Conference/Workshop/FDP/Guest Lecture
  type2: {
    type: String,
    required: true,
    enum: ['Organized', 'Participated']
  }, // Organized/Participated
  type3: {
    type: String,
    required: true,
    enum: ['National', 'International', 'Regional']
  }, // National/International/Regional
  host: {
    type: String,
    required: true,
    maxlength: 1000
  },
  agency: {
    type: String,
    required: true,
    maxlength: 1000
  },
  comment: {
    type: String,
    required: true
  },
  date1: { type: Date, required: true }, // Start date
  date2: { type: Date }, // End date
  status: {
        type: String,
        enum: ['Rejected','Pending', 'Accepted'],
        default: 'Pending'
    },
    academic_year: {
        type: String,
        maxlength: 1000
    },
  path: {
        type: String,
        maxlength: 1000
  }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Seminar', SeminarSchema);