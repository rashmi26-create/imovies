// server/seed/seed.js
const { memoryStore, isMongoConnected } = require('../config/db');
const { generate80SeatsGrid } = require('../controllers/showtimeController');

let User, Movie, Showtime, Booking;
try {
  User = require('../models/User');
  Movie = require('../models/Movie');
  Showtime = require('../models/Showtime');
  Booking = require('../models/Booking');
} catch (e) {}

const moviesData = [
  {
    id: "mov-1",
    _id: "660000000000000000000001",
    title: "Baahubali 2: The Conclusion",
    description: "When Mahendra Baahubali learns the truth behind the fall of Mahishmati and why Katappa killed Amarendra Baahubali, he rallies his people to reclaim his birthright and overthrow the tyrant Bhallaladeva.",
    genre: ["Action", "Drama", "Fantasy", "Period"],
    duration: 167,
    releaseDate: "2017-04-28",
    posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/embed/qD-6d8Wo3do",
    rating: 4.9,
    language: "Hindi",
    isTrending: true,
    priceStarting: 220
  },
  {
    id: "mov-2",
    _id: "660000000000000000000002",
    title: "Stree 2: Sarkate Ka Aatank",
    description: "The tranquil town of Chanderi is terrorized once again by a headless demonic phantom 'Sarkata'. Vicky, Bittu, Janna, and Rudra must summon the mysterious Stree to vanquish the darkness.",
    genre: ["Horror", "Comedy", "Thriller"],
    duration: 149,
    releaseDate: "2024-08-15",
    posterUrl: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/embed/kv16X4W9uuk",
    rating: 4.8,
    language: "Hindi",
    isTrending: false,
    priceStarting: 180
  },
  {
    id: "mov-3",
    _id: "660000000000000000000003",
    title: "Jawan",
    description: "A high-octane emotional spectacle following a man driven by a personal vendetta to right the socio-political wrongs in society, accompanied by a fearless team of women operatives.",
    genre: ["Action", "Thriller", "Drama"],
    duration: 169,
    releaseDate: "2023-09-07",
    posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/embed/COv52Qyctws",
    rating: 4.8,
    language: "Hindi",
    isTrending: false,
    priceStarting: 200
  },
  {
    id: "mov-4",
    _id: "660000000000000000000004",
    title: "12th Fail",
    description: "An inspiring true life narrative of Manoj Kumar Sharma, who emerges from Chambal's impoverished village to conquer the UPSC Civil Services Examination through sheer perseverance.",
    genre: ["Drama", "Biography"],
    duration: 147,
    releaseDate: "2023-10-27",
    posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/embed/we33pnhk8zI",
    rating: 4.9,
    language: "Hindi",
    isTrending: false,
    priceStarting: 160
  },
  {
    id: "mov-5",
    _id: "660000000000000000000005",
    title: "Oppenheimer",
    description: "Christopher Nolan's cinematic triumph chronicling the life of theoretical physicist J. Robert Oppenheimer, whose leadership at Los Alamos culminated in the creation of the Atomic Bomb.",
    genre: ["Biography", "Drama", "History"],
    duration: 180,
    releaseDate: "2023-07-21",
    posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg",
    rating: 4.9,
    language: "English",
    isTrending: true,
    priceStarting: 240
  },
  {
    id: "mov-6",
    _id: "660000000000000000000006",
    title: "Fighter",
    description: "Shamsher Pathania and his elite IAF Air Dragons unit embark on perilous tactical air missions in defense of Indian airspace against terrorist factions.",
    genre: ["Action", "Adventure"],
    duration: 166,
    releaseDate: "2024-01-25",
    posterUrl: "https://images.unsplash.com/photo-1519074069444-1ba4ea16e60b?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/embed/6amIq_mP4xM",
    rating: 4.6,
    language: "Hindi",
    isTrending: false,
    priceStarting: 190
  },
  {
    id: "mov-7",
    _id: "660000000000000000000007",
    title: "Interstellar (10th Anniversary IMAX)",
    description: "As Earth's habitability collapses, a courageous former NASA pilot joins a deep space expedition through a newly opened Saturn wormhole to find a habitable sanctuary for humankind.",
    genre: ["Sci-Fi", "Adventure", "Drama"],
    duration: 169,
    releaseDate: "2014-11-07",
    posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E",
    rating: 4.9,
    language: "English",
    isTrending: false,
    priceStarting: 280
  },
  {
    id: "mov-8",
    _id: "660000000000000000000008",
    title: "Animal",
    description: "A gripping and dark exploration of filial devotion as Ranvijay sets out on a destructive path of bloodshed and vengeance after an assassination attempt on his father.",
    genre: ["Action", "Crime", "Drama"],
    duration: 201,
    releaseDate: "2023-12-01",
    posterUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
    trailerUrl: "https://www.youtube.com/embed/Dydmpfo68DA",
    rating: 4.5,
    language: "Hindi",
    isTrending: false,
    priceStarting: 200
  }
];

async function seedDatabase() {
  console.log('[Seed] Populating initial dataset with Baahubali and Aaradhya Sharma...');

  // Setup memory store
  memoryStore.users = [
    {
      _id: "660000000000000000000099",
      id: "usr-admin",
      name: "IMovies Admin",
      email: "admin@imovies.com",
      password: "admin123",
      role: "admin"
    },
    {
      _id: "660000000000000000000098",
      id: "usr-demo",
      name: "Aaradhya Sharma",
      email: "aaradhya.sharma@imovies.com",
      password: "user123",
      role: "user"
    }
  ];

  memoryStore.movies = [...moviesData];

  // Generate showtimes with 80-seat matrix for Baahubali & Stree 2
  const st1Seats = generate80SeatsGrid(220);
  // Mark a few seats as booked for realism
  st1Seats.forEach(s => {
    if (['A3', 'A4', 'C5', 'C6', 'E4', 'E5'].includes(s.seatNumber)) {
      s.isBooked = true;
      s.bookedBy = 'usr-demo';
    }
  });

  const st2Seats = generate80SeatsGrid(200);
  st2Seats.forEach(s => {
    if (['B2', 'D4', 'D5'].includes(s.seatNumber)) s.isBooked = true;
  });

  memoryStore.showtimes = [
    {
      _id: "660000000000000000000010",
      id: "st-1",
      movieId: "660000000000000000000001",
      theaterName: "PVR IMAX Metropolis",
      showTime: "10:30 AM",
      showDate: "Today",
      format: "IMAX 3D",
      ticketPrice: 220,
      tierPrices: { Silver: 180, Gold: 260, Recliner: 380 },
      seats: st1Seats
    },
    {
      _id: "660000000000000000000011",
      id: "st-2",
      movieId: "660000000000000000000001",
      theaterName: "INOX Megaplex Dolby Atmos",
      showTime: "02:15 PM",
      showDate: "Today",
      format: "Dolby Atmos",
      ticketPrice: 200,
      tierPrices: { Silver: 170, Gold: 240, Recliner: 350 },
      seats: st2Seats
    },
    {
      _id: "660000000000000000000012",
      id: "st-3",
      movieId: "660000000000000000000002",
      theaterName: "PVR IMAX Metropolis",
      showTime: "06:30 PM",
      showDate: "Today",
      format: "4K Laser",
      ticketPrice: 180,
      tierPrices: { Silver: 150, Gold: 220, Recliner: 310 },
      seats: generate80SeatsGrid(180)
    }
  ];

  memoryStore.bookings = [
    {
      _id: "660000000000000000000050",
      id: "bk-1",
      bookingId: "IMV-98421",
      userId: "660000000000000000000098",
      userName: "Aaradhya Sharma",
      userEmail: "aaradhya.sharma@imovies.com",
      showtimeId: "660000000000000000000010",
      movieId: "660000000000000000000001",
      movieTitle: "Baahubali 2: The Conclusion",
      theaterName: "PVR IMAX Metropolis",
      showTime: "10:30 AM",
      showDate: "Today",
      seats: ["E4", "E5"],
      seatTier: "Gold",
      totalPrice: 555,
      status: "confirmed",
      createdAt: new Date().toISOString()
    }
  ];

  memoryStore.saveToDisk();

  // If MongoDB is connected, also seed MongoDB collections
  if (isMongoConnected() && User && Movie && Showtime && Booking) {
    try {
      await User.deleteMany({});
      await Movie.deleteMany({});
      await Showtime.deleteMany({});
      await Booking.deleteMany({});

      await User.insertMany(memoryStore.users);
      await Movie.insertMany(memoryStore.movies);
      await Showtime.insertMany(memoryStore.showtimes);
      await Booking.insertMany(memoryStore.bookings);
      console.log('[Seed] MongoDB seeded successfully!');
    } catch (e) {
      console.warn('[Seed] MongoDB collection sync skipped:', e.message);
    }
  }

  console.log('[Seed] Initial data populated successfully.');
}

module.exports = {
  seedDatabase,
  moviesData
};

if (require.main === module) {
  seedDatabase();
}
