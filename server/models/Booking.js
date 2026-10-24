// server/models/Booking.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const bookingSchema = new mongoose.Schema({
    bookingId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    userEmail: { type: String },
    showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    movieTitle: { type: String },
    theaterName: { type: String },
    showTime: { type: String },
    showDate: { type: String, default: 'Today' },
    seats: [{ type: String, required: true }],
    seatTier: { type: String, default: 'Gold' },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
  }, { timestamps: true });

  module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
} else {
  module.exports = class MockBooking {};
}
