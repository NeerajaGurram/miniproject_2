const mongoose = require('mongoose');

const ConferenceSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    title: {
        type: String,
        maxlength: 1000
    },
    type1: {
        type: String,
        maxlength: 1000
    },
    host: {
        type: String,
        maxlength: 1000
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

module.exports = mongoose.model('Conference', ConferenceSchema);