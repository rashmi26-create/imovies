// server/controllers/bookingController.js
const { memoryStore, isMongoConnected } = require('../config/db');
let Booking;
let Showtime;
try {
  Booking = require('../models/Booking');
  Showtime = require('../models/Showtime');
} catch (e) {
  Booking = null;
  Showtime = null;
}

exports.lockSeats = async (req, res) => {
  try {
    const { showtimeId, seats } = req.body;
    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Showtime ID and seats array are required' });
    }

    if (!memoryStore.lockedSeats[showtimeId]) {
      memoryStore.lockedSeats[showtimeId] = {};
    }

    const now = Date.now();
    const expiry = now + (10 * 60 * 1000); // 10 minutes lock

    seats.forEach(seat => {
      memoryStore.lockedSeats[showtimeId][seat] = expiry;
    });

    return res.json({
      message: 'Seats held temporarily for 10 minutes',
      showtimeId,
      seats,
      expiresAt: new Date(expiry).toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: 'Seat hold failed', error: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { showtimeId, seats, totalPrice, seatTier } = req.body;
    const userId = req.user ? (req.user.id || req.user._id) : 'usr-demo';
    const userName = req.user ? req.user.name : 'Aaradhya Sharma';
    const userEmail = req.user ? req.user.email : 'aaradhya.sharma@imovies.com';

    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'Showtime ID and seats are required' });
    }

    const bookingId = 'IMV-' + Math.floor(10000 + Math.random() * 90000);

    if (isMongoConnected() && Showtime && Booking) {
      const showtime = await Showtime.findById(showtimeId).populate('movieId');
      if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

      // Atomic Seat Check: verify none of the selected seats are already booked
      const conflict = showtime.seats.some(s => seats.includes(s.seatNumber) && s.isBooked);
      if (conflict) {
        return res.status(409).json({ message: 'One or more selected seats have already been booked.' });
      }

      // Mark seats as booked
      showtime.seats.forEach(s => {
        if (seats.includes(s.seatNumber)) {
          s.isBooked = true;
          s.bookedBy = userId;
        }
      });
      await showtime.save();

      const newBooking = new Booking({
        bookingId,
        userId,
        userName,
        userEmail,
        showtimeId,
        movieId: showtime.movieId ? showtime.movieId._id : null,
        movieTitle: showtime.movieId ? showtime.movieId.title : 'Movie Ticket',
        theaterName: showtime.theaterName,
        showTime: showtime.showTime,
        showDate: showtime.showDate || 'Today',
        seats,
        seatTier: seatTier || 'Gold',
        totalPrice: Number(totalPrice) || (seats.length * 200 + 35),
        status: 'confirmed'
      });

      await newBooking.save();
      return res.status(201).json({ message: 'Booking confirmed', booking: newBooking });
    }

    // Memory Store Fallback
    const showtimeMem = memoryStore.showtimes.find(s => (s._id || s.id) === showtimeId);
    let movieTitle = 'Baahubali 2: The Conclusion';
    let theaterName = 'PVR IMAX Metropolis';
    let showTime = '10:30 AM';
    let showDate = 'Today';

    if (showtimeMem) {
      theaterName = showtimeMem.theaterName || theaterName;
      showTime = showtimeMem.showTime || showTime;
      showDate = showtimeMem.showDate || showDate;
      const movie = memoryStore.movies.find(m => (m._id || m.id) === showtimeMem.movieId);
      if (movie) movieTitle = movie.title;

      if (showtimeMem.seats) {
        showtimeMem.seats.forEach(s => {
          if (seats.includes(s.seatNumber)) {
            s.isBooked = true;
            s.bookedBy = userId;
          }
        });
      }
    }

    const newBookingMem = {
      _id: 'bk-' + Date.now(),
      id: 'bk-' + Date.now(),
      bookingId,
      userId,
      userName,
      userEmail,
      showtimeId,
      movieId: showtimeMem ? showtimeMem.movieId : 'mov-1',
      movieTitle,
      theaterName,
      showTime,
      showDate,
      seats,
      seatTier: seatTier || 'Gold',
      totalPrice: Number(totalPrice) || (seats.length * 200 + 35),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    memoryStore.bookings.unshift(newBookingMem);
    memoryStore.saveToDisk();

    return res.status(201).json({ message: 'Booking confirmed', booking: newBookingMem });
  } catch (err) {
    res.status(500).json({ message: 'Booking transaction failed', error: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (isMongoConnected() && Booking && Booking.find) {
      const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
      return res.json(bookings);
    }

    const bookings = memoryStore.bookings.filter(b => b.userId === userId || userId === 'all' || userId === 'usr-demo');
    return res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve bookings', error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected() && Booking && Booking.findById) {
      const booking = await Booking.findById(id);
      if (!booking) return res.status(404).json({ message: 'Booking record not found' });

      booking.status = 'cancelled';
      await booking.save();

      // Release seats in Showtime
      const showtime = await Showtime.findById(booking.showtimeId);
      if (showtime && showtime.seats) {
        showtime.seats.forEach(s => {
          if (booking.seats.includes(s.seatNumber)) {
            s.isBooked = false;
            s.bookedBy = null;
          }
        });
        await showtime.save();
      }

      return res.json({ message: 'Booking cancelled and seats restored to availability.', booking });
    }

    const booking = memoryStore.bookings.find(b => (b._id || b.id || b.bookingId) === id);
    if (!booking) return res.status(404).json({ message: 'Booking record not found' });

    booking.status = 'cancelled';

    // Release seats
    const showtime = memoryStore.showtimes.find(s => (s._id || s.id) === booking.showtimeId);
    if (showtime && showtime.seats) {
      showtime.seats.forEach(s => {
        if (booking.seats.includes(s.seatNumber)) {
          s.isBooked = false;
          s.bookedBy = null;
        }
      });
    }

    memoryStore.saveToDisk();
    return res.json({ message: 'Booking cancelled and seats restored to availability.', booking });
  } catch (err) {
    res.status(500).json({ message: 'Cancellation failed', error: err.message });
  }
};
