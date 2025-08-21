const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    member: {
        type: String,
        maxlength: 1000
    },
    body: {
        type: String,
        maxlength: 1000
    },
    date2: {
        type: Date
    },
    term: {
        type: String,
        maxlength: 1000
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
    timestamps: true, // Adds createdAt and updatedAt
    // collection: 'member' // Matches your table name
});


module.exports = mongoose.model('Membership', MembershipSchema);