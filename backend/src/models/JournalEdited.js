const mongoose = require('mongoose');

const JournalEditedSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    journal: {
        type: String,
        maxlength: 1000
    },
    pub1: {
        type: String,
        maxlength: 1000
    },
    paper: {
        type: String,
        maxlength: 1000
    },
    type1: {
        type: String,
        maxlength: 1000
    },
    publisher: {
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
    timestamps: true, // Adds createdAt and updatedAt
    // collection: 'jedited' // Matches your table name
});


module.exports = mongoose.model('JournalEdited', JournalEditedSchema);