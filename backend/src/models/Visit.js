const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    type1: {
        type: String,
        maxlength: 1000
    },
    place: {
        type: String,
        maxlength: 1000
    },
    purpose: {
        type: String,
        maxlength: 1000
    },
    agency: {
        type: String,
        maxlength: 1000
    },
    amount: {
        type: String,
        maxlength: 100
    },
    date1: {
        type: Date
    },
    date2: {
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
    timestamps: true, // Adds createdAt and updatedAt
    // collection: 'visits' // Explicit collection name
});

module.exports = mongoose.model('Visit', VisitSchema);