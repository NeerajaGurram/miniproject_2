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
        enum: ['Rejected','Pending', 'Accepted'],
        default: 'Pending'
    },
    academic_year: {
        type: String,
        maxlength: 1000
    },
    path: {
        type: String,
        maxlength: 1000,
        required: true
    },
    reason: {
        type: String,
        default: '',
        maxlength: 1000
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Infrastructure', InfrastructureSchema);