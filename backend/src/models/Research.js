const mongoose = require('mongoose');

const ResearchSchema = new mongoose.Schema({
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
    issuedate: {
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
    pub1: {
        type: String,
        maxlength: 10000  // Note the large size for pub1
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
    timestamps: true,  // Adds createdAt and updatedAt
    // collection: 'research'  // Explicit collection name
});


module.exports = mongoose.model('Research', ResearchSchema);