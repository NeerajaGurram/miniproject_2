const e = require('express');
const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    title: {
        type: String,
        maxlength: 1000
    },
    name: {
        type: String,
        maxlength: 1000
    },
    issuedate: {
        type: Date
    },
    jnumber: {
        type: String,
        maxlength: 1000
    },
    pnumber: {
        type: String,
        maxlength: 1000
    },
    pos: {
        type: String,
        maxlength: 100
    },
    issn: {
        type: String,
        maxlength: 100
    },
    impact: {
        type: String,
        maxlength: 100
    },
    type1: {
        type: String,
        maxlength: 100,
        enum: ['National', 'International'],
    },
    scopus: {
        type: String,
        maxlength: 100,
        enum: ['Scopus', 'Not Scopus'],
    },
    pdate: {
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
        maxlength: 1000
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    // collection: 'journals' // Explicitly set collection name
});


module.exports = mongoose.model('Journal', JournalSchema);