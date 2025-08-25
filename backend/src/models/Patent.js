const mongoose = require('mongoose');

const PatentSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    title: {
        type: String,
        maxlength: 1000,
        required: true
    },
    fnum: {
        type: String,
        maxlength: 1000,
        required: true
    },
    date1: {
        type: Date,
        required: true
    },
    status1: {
        type: String,
        maxlength: 100,
        required: true
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
    timestamps: true, // Adds createdAt and updatedAt
    // collection: 'patents' // Matches your table name
});


module.exports = mongoose.model('Patent', PatentSchema);