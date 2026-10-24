// server/config/db.js
const fs = require('fs');
const path = require('path');

let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

const LOCAL_STORE_FILE = path.join(__dirname, '../data_store.json');

class MemoryStore {
  constructor() {
    this.users = [];
    this.movies = [];
    this.showtimes = [];
    this.bookings = [];
    this.lockedSeats = {}; // { showtimeId: { seatId: expiryTimestamp } }
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(LOCAL_STORE_FILE)) {
        const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.movies && parsed.movies.length > 0) {
          this.users = parsed.users || [];
          this.movies = parsed.movies || [];
          this.showtimes = parsed.showtimes || [];
          this.bookings = parsed.bookings || [];
        }
      }
    } catch (e) {}
  }

  saveToDisk() {
    try {
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify({
        users: this.users,
        movies: this.movies,
        showtimes: this.showtimes,
        bookings: this.bookings
      }, null, 2), 'utf8');
    } catch (e) {}
  }
}

const memoryStore = new MemoryStore();
let isMongoConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies';
  if (mongoose) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      isMongoConnected = true;
      console.log(`[Database] MongoDB connected successfully: ${uri}`);
      return true;
    } catch (err) {
      console.log(`[Database] MongoDB not reachable (${err.message}). Running on high-performance Local Memory Store.`);
      isMongoConnected = false;
      return false;
    }
  } else {
    console.log('[Database] Mongoose package not loaded. Running on Local Memory Store.');
    return false;
  }
}

module.exports = {
  connectDB,
  memoryStore,
  isMongoConnected: () => isMongoConnected
};
