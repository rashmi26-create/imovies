// server.js - IMovies Full Stack Cinema Platform
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { connectDB, store, getIsConnectedToMongo } = require('./config/db');

const PORT = process.env.PORT || 5000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Clean expired transient seat locks every 30s
setInterval(() => {
  const now = Date.now();
  for (const stId in store.data.lockedSeats) {
    for (const seatId in store.data.lockedSeats[stId]) {
      if (store.data.lockedSeats[stId][seatId] < now) {
        delete store.data.lockedSeats[stId][seatId];
      }
    }
  }
}, 30000);

// Request Handler
async function requestHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const query = parsedUrl.query;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==================== REST API ENDPOINTS ====================

  // 1. Health & Database Status
  if (pathname === '/api/health' && method === 'GET') {
    return sendJSON(res, 200, {
      status: 'online',
      service: 'IMovies Backend Gateway',
      version: '1.0.0',
      connectedToMongo: getIsConnectedToMongo(),
      totalMovies: store.data.movies.length,
      timestamp: new Date().toISOString()
    });
  }

  // 2. Authentication: Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req);
    const { email, password } = body;
    const user = store.data.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user || user.password !== password) {
      return sendJSON(res, 401, { error: 'Invalid email or password' });
    }

    const token = 'imv_token_' + Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');
    return sendJSON(res, 200, {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        watchlist: user.watchlist || []
      }
    });
  }

  // 3. Authentication: Register
  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await parseBody(req);
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return sendJSON(res, 400, { error: 'Name, email, and password are required' });
    }

    const existing = store.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return sendJSON(res, 400, { error: 'An account with this email already exists' });
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name,
      email,
      password,
      role: 'user',
      watchlist: []
    };

    store.data.users.push(newUser);
    store.saveToDisk();

    const token = 'imv_token_' + Buffer.from(`${newUser.id}:${newUser.email}:${Date.now()}`).toString('base64');
    return sendJSON(res, 201, {
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        watchlist: newUser.watchlist
      }
    });
  }

  // 4. Movies Catalog (Search, Filter by Language, Genre, City)
  if (pathname === '/api/movies' && method === 'GET') {
    let movies = [...store.data.movies];
    const { search, language, genre, isTrending } = query;

    if (search) {
      const term = search.toLowerCase();
      movies = movies.filter(m => 
        m.title.toLowerCase().includes(term) ||
        m.genres.some(g => g.toLowerCase().includes(term)) ||
        (m.cast && m.cast.some(c => c.toLowerCase().includes(term))) ||
        (m.director && m.director.toLowerCase().includes(term))
      );
    }

    if (language && language !== 'All') {
      movies = movies.filter(m => m.language.toLowerCase() === language.toLowerCase());
    }

    if (genre && genre !== 'All' && genre !== 'All Films') {
      movies = movies.filter(m => 
        m.genres.some(g => g.toLowerCase() === genre.toLowerCase())
      );
    }

    if (isTrending === 'true') {
      movies = movies.filter(m => m.isTrending);
    }

    return sendJSON(res, 200, {
      count: movies.length,
      movies
    });
  }

  // 5. Single Movie Details
  if (pathname.startsWith('/api/movies/') && method === 'GET') {
    const movieId = pathname.split('/')[3];
    const movie = store.data.movies.find(m => m.id === movieId);
    if (!movie) {
      return sendJSON(res, 404, { error: 'Movie not found' });
    }
    return sendJSON(res, 200, movie);
  }

  // 6. Admin Add Movie
  if (pathname === '/api/movies' && method === 'POST') {
    const body = await parseBody(req);
    const { title, language, genres, durationMins, posterUrl, synopsis, certification, priceStarting, trailerUrl } = body;

    if (!title || !language || !posterUrl || !synopsis) {
      return sendJSON(res, 400, { error: 'Title, language, posterUrl, and synopsis are required' });
    }

    const newMovie = {
      id: 'mov-' + Date.now(),
      title,
      language,
      genres: Array.isArray(genres) ? genres : (genres ? genres.split(',').map(s => s.trim()) : ['Drama']),
      rating: body.rating ? parseFloat(body.rating) : 4.5,
      reviewCount: 0,
      certification: certification || 'UA',
      durationMins: parseInt(durationMins) || 150,
      releaseDate: new Date().toISOString().split('T')[0],
      posterUrl,
      bannerUrl: posterUrl,
      trailerUrl: trailerUrl || 'https://www.youtube.com/embed/Way9Dexny3w',
      synopsis,
      cast: body.cast ? (Array.isArray(body.cast) ? body.cast : body.cast.split(',')) : ['Featured Ensemble'],
      director: body.director || 'Acclaimed Filmmaker',
      isTrending: body.isTrending === true || body.isTrending === 'true',
      priceStarting: parseInt(priceStarting) || 200
    };

    store.data.movies.unshift(newMovie);

    // Auto-generate a showtime for this new movie at primary theatres
    store.data.showtimes.push({
      id: 'st-' + Date.now(),
      movieId: newMovie.id,
      theatreId: 'th-1',
      theatreName: 'PVR IMAX Metropolis',
      time: '04:00 PM',
      format: '4K Dolby Atmos',
      date: 'Today',
      tierPrices: { Silver: newMovie.priceStarting, Gold: newMovie.priceStarting + 70, Recliner: newMovie.priceStarting + 180 },
      bookedSeats: []
    });

    store.saveToDisk();
    return sendJSON(res, 201, { message: 'Movie added successfully', movie: newMovie });
  }

  // 7. Admin Delete Movie
  if (pathname.startsWith('/api/movies/') && method === 'DELETE') {
    const movieId = pathname.split('/')[3];
    const initialLen = store.data.movies.length;
    store.data.movies = store.data.movies.filter(m => m.id !== movieId);

    if (store.data.movies.length === initialLen) {
      return sendJSON(res, 404, { error: 'Movie not found' });
    }

    store.saveToDisk();
    return sendJSON(res, 200, { message: 'Movie deleted successfully' });
  }

  // 8. Theatres Listing
  if (pathname === '/api/theatres' && method === 'GET') {
    let theatres = [...store.data.theatres];
    if (query.city && query.city !== 'All' && query.city !== 'Metro City (All Theatres)') {
      theatres = theatres.filter(t => t.city.toLowerCase() === query.city.toLowerCase() || t.city === 'Metro City');
    }
    return sendJSON(res, 200, { count: theatres.length, theatres });
  }

  // 9. Showtimes for a Movie
  if (pathname === '/api/showtimes' && method === 'GET') {
    let showtimes = [...store.data.showtimes];
    if (query.movieId) {
      showtimes = showtimes.filter(s => s.movieId === query.movieId);
    }
    if (query.theatreId) {
      showtimes = showtimes.filter(s => s.theatreId === query.theatreId);
    }

    // Merge transient locked seats
    showtimes = showtimes.map(st => {
      const lockedMap = store.data.lockedSeats[st.id] || {};
      const activeLocked = Object.keys(lockedMap).filter(seat => lockedMap[seat] > Date.now());
      return {
        ...st,
        lockedSeats: activeLocked
      };
    });

    return sendJSON(res, 200, { count: showtimes.length, showtimes });
  }

  // 10. Transient Seat Locking
  if (pathname === '/api/bookings/lock-seats' && method === 'POST') {
    const body = await parseBody(req);
    const { showtimeId, seats } = body;

    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return sendJSON(res, 400, { error: 'ShowtimeId and seats array are required' });
    }

    const showtime = store.data.showtimes.find(s => s.id === showtimeId);
    if (!showtime) {
      return sendJSON(res, 404, { error: 'Showtime not found' });
    }

    // Check if any seat is already booked
    const alreadyBooked = seats.some(seat => showtime.bookedSeats.includes(seat));
    if (alreadyBooked) {
      return sendJSON(res, 409, { error: 'One or more selected seats have already been booked' });
    }

    // Check if seat is locked by someone else
    if (!store.data.lockedSeats[showtimeId]) {
      store.data.lockedSeats[showtimeId] = {};
    }

    const now = Date.now();
    const expiry = now + (10 * 60 * 1000); // 10 minutes lock

    seats.forEach(seat => {
      store.data.lockedSeats[showtimeId][seat] = expiry;
    });

    return sendJSON(res, 200, {
      message: 'Seats locked for 10 minutes',
      showtimeId,
      seats,
      lockExpiresAt: new Date(expiry).toISOString()
    });
  }

  // 11. Finalize Booking (Confirm & Issue Digital Ticket)
  if (pathname === '/api/bookings/confirm' && method === 'POST') {
    const body = await parseBody(req);
    const {
      userId,
      userEmail,
      userName,
      movieId,
      movieTitle,
      posterUrl,
      theatreId,
      theatreName,
      showtimeId,
      showTime,
      showDate,
      seats,
      seatTier,
      subtotal,
      convenienceFee,
      totalAmount
    } = body;

    if (!showtimeId || !seats || seats.length === 0) {
      return sendJSON(res, 400, { error: 'Missing required booking information' });
    }

    const showtime = store.data.showtimes.find(s => s.id === showtimeId);
    if (showtime) {
      // Add seats to booked list
      seats.forEach(s => {
        if (!showtime.bookedSeats.includes(s)) {
          showtime.bookedSeats.push(s);
        }
      });
      // Clear transient locks
      if (store.data.lockedSeats[showtimeId]) {
        seats.forEach(s => delete store.data.lockedSeats[showtimeId][s]);
      }
    }

    const bookingId = 'IMV-' + Math.floor(10000 + Math.random() * 90000);
    const newBooking = {
      bookingId,
      userId: userId || 'guest',
      userEmail: userEmail || 'guest@imovies.com',
      userName: userName || 'Movie Patron',
      movieId,
      movieTitle,
      posterUrl: posterUrl || '',
      theatreId,
      theatreName,
      showtimeId,
      showTime: showTime || '10:30 AM',
      showDate: showDate || 'Today',
      seats,
      seatTier: seatTier || 'Gold',
      subtotal: subtotal || (seats.length * 200),
      convenienceFee: convenienceFee || 35,
      totalAmount: totalAmount || (subtotal + 35),
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      bookedAt: new Date().toISOString()
    };

    store.data.bookings.unshift(newBooking);
    store.saveToDisk();

    return sendJSON(res, 201, {
      message: 'Booking confirmed successfully',
      booking: newBooking
    });
  }

  // 12. Retrieve User Bookings
  if (pathname.startsWith('/api/bookings/user/') && method === 'GET') {
    const userId = pathname.split('/')[4];
    const userBookings = store.data.bookings.filter(b => b.userId === userId || userId === 'all');
    return sendJSON(res, 200, { count: userBookings.length, bookings: userBookings });
  }

  // 13. Cancel Booking
  if (pathname.startsWith('/api/bookings/cancel/') && method === 'POST') {
    const bookingId = pathname.split('/')[4];
    const booking = store.data.bookings.find(b => b.bookingId === bookingId);
    if (!booking) {
      return sendJSON(res, 404, { error: 'Booking not found' });
    }

    booking.bookingStatus = 'Cancelled';
    // Release seats from showtime
    const showtime = store.data.showtimes.find(s => s.id === booking.showtimeId);
    if (showtime) {
      showtime.bookedSeats = showtime.bookedSeats.filter(s => !booking.seats.includes(s));
    }

    store.saveToDisk();
    return sendJSON(res, 200, { message: 'Booking cancelled and seats released', booking });
  }

  // 14. Audience Reviews: Get Reviews for Movie
  if (pathname.startsWith('/api/reviews/movie/') && method === 'GET') {
    const movieId = pathname.split('/')[4];
    const movieReviews = store.data.reviews.filter(r => r.movieId === movieId);
    return sendJSON(res, 200, { count: movieReviews.length, reviews: movieReviews });
  }

  // 15. Audience Reviews: Add Review
  if (pathname === '/api/reviews' && method === 'POST') {
    const body = await parseBody(req);
    const { movieId, userName, rating, comment } = body;

    if (!movieId || !comment || !rating) {
      return sendJSON(res, 400, { error: 'MovieId, rating, and comment are required' });
    }

    const newReview = {
      id: 'rev-' + Date.now(),
      movieId,
      userName: userName || 'Film Enthusiast',
      rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
      comment,
      date: new Date().toISOString().split('T')[0]
    };

    store.data.reviews.unshift(newReview);

    // Update movie rating average
    const movie = store.data.movies.find(m => m.id === movieId);
    if (movie) {
      const allForMovie = store.data.reviews.filter(r => r.movieId === movieId);
      const avg = allForMovie.reduce((acc, r) => acc + r.rating, 0) / allForMovie.length;
      movie.rating = parseFloat(avg.toFixed(1));
      movie.reviewCount = (movie.reviewCount || 0) + 1;
    }

    store.saveToDisk();
    return sendJSON(res, 201, { message: 'Review published', review: newReview });
  }

  // 16. Watchlist Toggle
  if (pathname === '/api/watchlist/toggle' && method === 'POST') {
    const body = await parseBody(req);
    const { userId, movieId } = body;

    const user = store.data.users.find(u => u.id === userId);
    if (!user) {
      return sendJSON(res, 404, { error: 'User not found' });
    }

    if (!user.watchlist) user.watchlist = [];
    const index = user.watchlist.indexOf(movieId);
    let isSaved = false;

    if (index > -1) {
      user.watchlist.splice(index, 1);
      isSaved = false;
    } else {
      user.watchlist.push(movieId);
      isSaved = true;
    }

    store.saveToDisk();
    return sendJSON(res, 200, { isSaved, watchlist: user.watchlist });
  }

  // 17. Admin Analytics Dashboard
  if (pathname === '/api/admin/stats' && method === 'GET') {
    const confirmedBookings = store.data.bookings.filter(b => b.bookingStatus === 'Confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0);

    return sendJSON(res, 200, {
      totalRevenue,
      totalTicketsSold,
      totalBookings: confirmedBookings.length,
      totalMovies: store.data.movies.length,
      totalTheatres: store.data.theatres.length,
      recentBookings: store.data.bookings.slice(0, 8)
    });
  }

  // ==================== STATIC FILE SERVING ====================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  // If path doesn't have an extension, try index.html
  if (!ext && !fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing to index.html
      const fallbackIndex = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallbackIndex, (fbErr, content) => {
        if (fbErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Boot up server
const server = http.createServer(requestHandler);

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  🎬 IMOVIES - Cinema Ticket Booking Platform is Live!  `);
    console.log(`  Local URL:   http://localhost:${PORT}                 `);
    console.log(`  API Gateway: http://localhost:${PORT}/api/movies       `);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'} `);
    console.log(`=======================================================`);
  });
}

start();
