// server/server.js - Node.js & Express API Gateway
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB, memoryStore } = require('./config/db');
const { seedDatabase } = require('./seed/seed');

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showtimeRoutes = require('./routes/showtimeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'IMovies REST API Server',
    version: '1.0.0',
    moviesCount: memoryStore.movies.length
  });
});

// Serve Frontend Static Build if present in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  const indexFile = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexFile, err => {
    if (err) res.status(200).send('IMovies Express API is running. Client build in /client.');
  });
});

// Boot Server
async function startServer() {
  await connectDB();
  // Auto-seed if memory store or DB is empty
  if (memoryStore.movies.length === 0) {
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  🎬 IMOVIES EXPRESS BACKEND ACTIVE                     `);
    console.log(`  Port:        http://localhost:${PORT}                 `);
    console.log(`  API Routes:  /api/auth, /api/movies, /api/showtimes   `);
    console.log(`=======================================================`);
  });
}

startServer();
