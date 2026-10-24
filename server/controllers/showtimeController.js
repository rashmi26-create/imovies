// server/controllers/showtimeController.js
const { memoryStore, isMongoConnected } = require('../config/db');
let Showtime;
try {
  Showtime = require('../models/Showtime');
} catch (e) {
  Showtime = null;
}

function generate80SeatsGrid(basePrice = 180) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seats = [];

  rows.forEach(row => {
    let tier = 'Gold';
    let price = basePrice + 70;

    if (row === 'A' || row === 'B') {
      tier = 'Recliner';
      price = basePrice + 160;
    } else if (row === 'F' || row === 'G' || row === 'H') {
      tier = 'Silver';
      price = basePrice;
    }

    for (let i = 1; i <= 10; i++) {
      seats.push({
        seatNumber: `${row}${i}`,
        row,
        number: i,
        tier,
        price,
        isBooked: false,
        bookedBy: null
      });
    }
  });

  return seats;
}

exports.generate80SeatsGrid = generate80SeatsGrid;

exports.getShowtimesByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    if (isMongoConnected() && Showtime && Showtime.find) {
      const showtimes = await Showtime.find({ movieId });
      return res.json(showtimes);
    }

    const showtimes = memoryStore.showtimes.filter(s => (s.movieId === movieId || String(s.movieId) === String(movieId)));
    return res.json(showtimes);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving showtimes', error: err.message });
  }
};

exports.getShowtimeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected() && Showtime && Showtime.findById) {
      const showtime = await Showtime.findById(id).populate('movieId');
      if (!showtime) return res.status(404).json({ message: 'Showtime not found' });
      return res.json(showtime);
    }

    const showtime = memoryStore.showtimes.find(s => (s._id || s.id) === id);
    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });
    return res.json(showtime);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving showtime', error: err.message });
  }
};

exports.createShowtime = async (req, res) => {
  try {
    const { movieId, theaterName, showTime, showDate, format, ticketPrice } = req.body;

    if (!movieId || !theaterName || !showTime) {
      return res.status(400).json({ message: 'Movie ID, Theater Name, and Show Time are required' });
    }

    const price = Number(ticketPrice) || 180;
    const seats = generate80SeatsGrid(price);

    if (isMongoConnected() && Showtime) {
      const newShowtime = new Showtime({
        movieId,
        theaterName,
        showTime,
        showDate: showDate || 'Today',
        format: format || 'Dolby Atmos',
        ticketPrice: price,
        tierPrices: { Silver: price, Gold: price + 70, Recliner: price + 160 },
        seats
      });
      await newShowtime.save();
      return res.status(201).json(newShowtime);
    }

    const newShowtimeMem = {
      _id: 'st-' + Date.now(),
      id: 'st-' + Date.now(),
      movieId,
      theaterName,
      showTime,
      showDate: showDate || 'Today',
      format: format || 'Dolby Atmos',
      ticketPrice: price,
      tierPrices: { Silver: price, Gold: price + 70, Recliner: price + 160 },
      seats,
      createdAt: new Date().toISOString()
    };
    memoryStore.showtimes.push(newShowtimeMem);
    memoryStore.saveToDisk();

    return res.status(201).json(newShowtimeMem);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create showtime schedule', error: err.message });
  }
};
