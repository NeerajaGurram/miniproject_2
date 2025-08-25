const mongoose = require('mongoose');

const PhdGuidingSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    university: {
        type: String,
        maxlength: 1000
    },
    special: {
        type: String,
        maxlength: 1000
    },
    name: {
        type: String,
        maxlength: 1000
    },
    sdate: {
        type: Date
    },
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
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('PhdGuiding', PhdGuidingSchema);
// // models/PhdGuiding.js
// const PhdGuidingSchema = new mongoose.Schema({
//   empId: { type: String, ref: 'User', required: true },
//   university: { type: String, required: true },
//   specialization: { type: String, required: true },
//   scholarName: { type: String, required: true },
//   date: { type: Date, required: true },
//   verification: { type: Number, default: 0 },
//   filePath: { type: String },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('PhdGuiding', PhdGuidingSchema);