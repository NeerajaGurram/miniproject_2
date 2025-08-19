// // models/Phd.js
const mongoose = require('mongoose');

const PhdSchema = new mongoose.Schema({
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
    guide: {
        type: String,
        maxlength: 1000
    },
    college: {
        type: String,
        maxlength: 1000
    },
    dept: {
        type: String,
        maxlength: 1000
    },
    statuss: {
        type: String,
        maxlength: 100,
        enum: ['Awarded', 'Submitted', 'Doing'],
    },
    sdate: {
        type: Date
    },
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
        maxlength: 1000
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Phd', PhdSchema);