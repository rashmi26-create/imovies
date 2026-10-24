// server/server.js - Node.js & Express API Gateway
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

let express = null;
let cors = null;
let dotenv = null;

try {
  express = require('express');
  cors = require('cors');
  dotenv = require('dotenv');
  if (dotenv) dotenv.config();
} catch (e) {
  // Gracefully fallback to native HTTP engine if node_modules are not yet installed
}

const { connectDB, memoryStore } = require('./config/db');
const { seedDatabase } = require('./seed/seed');

const PORT = process.env.PORT || 5000;
const CLIENT_DIST = path.join(__dirname, '../client/dist');

// Ensure seed data is populated
if (memoryStore.movies.length === 0) {
  seedDatabase();
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

if (express) {
  // ==================== EXPRESS ENGINE ====================
  const app = express();
  if (cors) app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const authRoutes = require('./routes/authRoutes');
  const movieRoutes = require('./routes/movieRoutes');
  const showtimeRoutes = require('./routes/showtimeRoutes');
  const bookingRoutes = require('./routes/bookingRoutes');

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/showtimes', showtimeRoutes);
  app.use('/api/bookings', bookingRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'online', service: 'IMovies REST API', moviesCount: memoryStore.movies.length });
  });

  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });

  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  🎬 IMOVIES ACTIVE ON: http://localhost:${PORT}        `);
      console.log(`  API Gateway:          http://localhost:${PORT}/api    `);
      console.log(`=======================================================`);
    });
  });

} else {
  // ==================== NATIVE ZERO-CONFIG ENGINE ====================
  const movieController = require('./controllers/movieController');
  const showtimeController = require('./controllers/showtimeController');
  const bookingController = require('./controllers/bookingController');
  const authController = require('./controllers/authController');

  function parseBody(req) {
    return new Promise(resolve => {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try { resolve(JSON.parse(body || '{}')); } catch (e) { resolve({}); }
      });
    });
  }

  function sendJSON(res, status, data) {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
  }

  const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;
    const method = req.method;

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      return res.end();
    }

    const mockRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { sendJSON(res, this.statusCode || 200, data); },
      send(msg) { res.writeHead(200); res.end(msg); }
    };

    req.query = parsed.query;
    req.body = await parseBody(req);
    req.user = { id: 'usr-demo', name: 'Aaradhya Sharma', role: 'user', email: 'aaradhya.sharma@imovies.com' };

    // API Routes
    if (pathname === '/api/health') {
      return sendJSON(res, 200, { status: 'online', service: 'IMovies REST API', moviesCount: memoryStore.movies.length });
    }
    if (pathname === '/api/auth/register' && method === 'POST') {
      return authController.register(req, mockRes);
    }
    if (pathname === '/api/auth/login' && method === 'POST') {
      return authController.login(req, mockRes);
    }
    if (pathname === '/api/auth/me') {
      return authController.getProfile(req, mockRes);
    }
    if (pathname === '/api/movies' && method === 'GET') {
      return movieController.getAllMovies(req, mockRes);
    }
    if (pathname.startsWith('/api/movies/') && method === 'GET') {
      req.params = { id: pathname.split('/')[3] };
      return movieController.getMovieById(req, mockRes);
    }
    if (pathname === '/api/movies' && method === 'POST') {
      return movieController.createMovie(req, mockRes);
    }
    if (pathname.startsWith('/api/movies/') && method === 'DELETE') {
      req.params = { id: pathname.split('/')[3] };
      return movieController.deleteMovie(req, mockRes);
    }
    if (pathname.startsWith('/api/showtimes/movie/') && method === 'GET') {
      req.params = { movieId: pathname.split('/')[4] };
      return showtimeController.getShowtimesByMovie(req, mockRes);
    }
    if (pathname.startsWith('/api/showtimes/') && method === 'GET') {
      req.params = { id: pathname.split('/')[3] };
      return showtimeController.getShowtimeById(req, mockRes);
    }
    if (pathname === '/api/bookings/lock' && method === 'POST') {
      return bookingController.lockSeats(req, mockRes);
    }
    if (pathname === '/api/bookings' && method === 'POST') {
      return bookingController.createBooking(req, mockRes);
    }
    if (pathname.startsWith('/api/bookings/user/') && method === 'GET') {
      req.params = { userId: pathname.split('/')[4] };
      return bookingController.getUserBookings(req, mockRes);
    }
    if (pathname.startsWith('/api/bookings/cancel/') && method === 'PUT') {
      req.params = { id: pathname.split('/')[4] };
      return bookingController.cancelBooking(req, mockRes);
    }

    // Static Frontend Serving
    let filePath = path.join(CLIENT_DIST, pathname === '/' ? 'index.html' : pathname);
    let ext = path.extname(filePath).toLowerCase();

    if (!ext || !fs.existsSync(filePath)) {
      filePath = path.join(CLIENT_DIST, 'index.html');
      ext = '.html';
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Page not found');
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/html' });
      res.end(data);
    });
  });

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  🎬 IMOVIES RUNNING ON: http://localhost:${PORT}       `);
    console.log(`  API Routes:          http://localhost:${PORT}/api   `);
    console.log(`=======================================================`);
  });
}
