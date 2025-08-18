// models/ResearchGrant.js
const mongoose = require('mongoose');
const ResearchGrantSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    title: {
        type: String,
        maxlength: 1000
    },
    duration: {
        type: String,
        maxlength: 1000
    },
    agency: {
        type: String,
        maxlength: 1000
    },
    letter: {
        type: String,
        maxlength: 1000
    },
    date1: {
        type: Date
    },
    amount: {
        type: String,
        maxlength: 1000
    },
    type1: {
        type: String,
        maxlength: 1000
    },
    type2: {
        type: String,
        maxlength: 100
    },
    comment: {
        type: String,
        maxlength: 10000  // Note the large size for comment
    },
    status: {
        type: String,
        enum: ['0', '1'],
        default: '1'
    },
    path: {
        type: String,
        maxlength: 1000
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt
    // collection: 'research'  // Explicit collection name
});

module.exports = mongoose.model('ResearchGrant', ResearchGrantSchema);