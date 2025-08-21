// models/Consultancy.js

const mongoose = require('mongoose');

const ConsultancySchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    work: {
        type: String,
        maxlength: 1000,
        required: true
    },
    agency: {
        type: String,
        maxlength: 1000,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    verification: {
        type: Number,
        default: 0,
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
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    // collection: 'patents' // Matches your table name
});

module.exports = mongoose.model('Consultancy', ConsultancySchema);