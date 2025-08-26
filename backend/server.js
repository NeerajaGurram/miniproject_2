const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Import routes
const authRoutes = require('./src/routes/auth');
const researchRoutes = require('./src/routes/research');
const userRoutes = require('./src/routes/users');
const reportRoutes = require('./src/routes/reports');
const uploadRoutes = require('./src/routes/upload');
const facultyRoutes = require('./src/routes/faculty');
const passwordRoutes = require('./src/routes/change-password');
const phdRoutes = require('./src/routes/phd');
const phdguidingRoutes = require('./src/routes/phdguiding');
const journalRoutes = require('./src/routes/journals');
const bookRoutes = require('./src/routes/books');
const journalEditedRoutes = require('./src/routes/journaledited');
const researchGrantsRoutes = require('./src/routes/researchgrant');
const patentRoutes = require('./src/routes/patents');
const qualificationRoutes = require('./src/routes/qualifications');
const visitRoutes = require('./src/routes/visits');
const awardRoutes = require('./src/routes/awards');
const membershipRoutes = require('./src/routes/membership');
const consultancyRoutes = require('./src/routes/consultancy');
const infrastructureRoutes = require('./src/routes/infrastructure');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000' || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
// Debugging middleware - add this before your routes
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} ${req.path}`);
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/faculty', facultyRoutes);
// Mount at root level
app.use('/api/change-password', passwordRoutes);
app.use('/api/phd', phdRoutes);
app.use('/api/phdguiding', phdguidingRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/journaledited', journalEditedRoutes);
app.use('/api/researchgrant', researchGrantsRoutes);
app.use('/api/patents', patentRoutes);
app.use('/api/qualifications', qualificationRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/consultancy', consultancyRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/s-c-w-fdp-g', require('./src/routes/s-c-w-fdp-g'));
app.use('/api/counts', require('./src/routes/counts'));


app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app; 