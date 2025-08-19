// models/Award.js
const mongoose = require('mongoose');

const AwardSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    award: {
        type: String,
        maxlength: 1000
    },
    type1: {
        type: String,
        maxlength: 1000
    },
    type2: {
        type: String,
        maxlength: 1000
    },
    agency: {
        type: String,
        maxlength: 1000
    },
    ifany: {
        type: String,
        maxlength: 1000
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
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Award', AwardSchema);
// // models/Award.js
// const AwardSchema = new mongoose.Schema({
//   empId: { type: String, ref: 'User', required: true },
//   title: { type: String, required: true },
//   type1: { type: String }, // Academic/Professional
//   type2: { type: String }, // National/International
//   agency: { type: String, required: true },
//   details: { type: String },
//   date: { type: Date, required: true },
//   verification: { type: Number, default: 0 },
//   filePath: { type: String },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Award', AwardSchema);