// models/Book.js
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    empId: {
        type: String,
        required: true,
        maxlength: 25
    },
    book: {
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
    pub1: {
        type: String,
        maxlength: 1000
    },
    sdate: {
        type: Date
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
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Book', BookSchema);
// // models/Book.js
// const BookSchema = new mongoose.Schema({
//   empId: { type: String, ref: 'User', required: true },
//   bookName: { type: String, required: true },
//   type: { type: String, required: true }, // Textbook/Reference Book
//   publisher: { type: String, required: true },
//   publicationDetails: { type: String },
//   date: { type: Date, required: true },
//   verification: { type: Number, default: 0 },
//   filePath: { type: String },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Book', BookSchema);