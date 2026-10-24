// config/db.js
const fs = require('fs');
const path = require('path');
const seedData = require('../data/seedData');

let isConnectedToMongo = false;
let mongoose = null;

try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

// In-Memory & Persistent Local Storage Store (Zero-Config Fallback)
const LOCAL_STORE_FILE = path.join(__dirname, '../data/local_store.json');

class DataStore {
  constructor() {
    this.data = {
      users: [
        {
          id: "usr-admin",
          name: "IMovies Exhibitor Admin",
          email: "admin@imovies.com",
          password: "admin123", // In prod: bcrypt hash
          role: "admin",
          watchlist: ["mov-1", "mov-2"]
        },
        {
          id: "usr-demo",
          name: "Aaradhya Sharma",
          email: "aaradhya.sharma@imovies.com",
          password: "user123",
          role: "user",
          watchlist: ["mov-1", "mov-2"]
        }
      ],
      movies: [...seedData.movies],
      theatres: [...seedData.theatres],
      showtimes: [...seedData.showtimes],
      bookings: [
        {
          bookingId: "IMV-98421",
          userId: "usr-demo",
          userEmail: "aaradhya.sharma@imovies.com",
          userName: "Aaradhya Sharma",
          movieId: "mov-1",
          movieTitle: "Baahubali 2: The Conclusion",
          posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
          theatreId: "th-1",
          theatreName: "PVR IMAX Metropolis",
          showtimeId: "st-1",
          showTime: "10:30 AM",
          showDate: "Today",
          seats: ["E4", "E5"],
          seatTier: "Gold",
          subtotal: 520,
          convenienceFee: 35,
          totalAmount: 555,
          paymentStatus: "Paid",
          bookingStatus: "Confirmed",
          bookedAt: new Date().toISOString()
        }
      ],
      reviews: [...seedData.reviews],
      lockedSeats: {} // transient locks: { showtimeId: { seatId: expiryTimestamp } }
    };
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(LOCAL_STORE_FILE)) {
        const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.movies && parsed.movies.length > 0) {
          this.data = { ...this.data, ...parsed };
        }
      }
    } catch (e) {
      // Use in-memory defaults
    }
  }

  saveToDisk() {
    try {
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      // Ignore disk write errors
    }
  }
}

const store = new DataStore();

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies';

  if (mongoose) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500
      });
      isConnectedToMongo = true;
      console.log(`[Database] Successfully connected to MongoDB at: ${mongoUri}`);
      return true;
    } catch (err) {
      console.log(`[Database] MongoDB not reachable (${err.message}). Seamlessly activated built-in High-Speed JSON DataStore.`);
      isConnectedToMongo = false;
      return false;
    }
  } else {
    console.log('[Database] Mongoose package not installed. Running on built-in Zero-Config High-Speed DataStore.');
    return false;
  }
}

module.exports = {
  connectDB,
  store,
  getIsConnectedToMongo: () => isConnectedToMongo
};
