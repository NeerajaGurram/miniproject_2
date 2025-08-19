// models/Infrastructure.js
const mongoose = require('mongoose');
const InfrastructureSchema = new mongoose.Schema({
  empId: {
        type: String,
        required: true,
        maxlength: 25
    },
  title: { type: String, required: true },
  title1: { type: String, required: true },
  comment: { type: String },
  title2: { type: String, required: true },
  date2: { type: Date, required: true },
  status: {
        type: String,
        enum: ['-1','0', '1'],
        default: '0'
    },
    academic_year: {
        type: String,
        maxlength: 1000
    },
    path: {
        type: String,
        maxlength: 1000,
        required: true
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Infrastructure', InfrastructureSchema);