const mongoose = require('mongoose');

const QualificationSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    impro: {
        type: String,
        maxlength: 1000
    },
    special: {
        type: String,
        maxlength: 1000
    },
    type1: {
        type: String,
        maxlength: 100
    },
    name: {
        type: String,
        maxlength: 1000
    },
    date1: {
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
    timestamps: true, // Adds createdAt and updatedAt automatically
    // collection: 'qualifications' // Explicit collection name
});


module.exports = mongoose.model('Qualification', QualificationSchema);