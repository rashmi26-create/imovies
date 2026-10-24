// models/Booking.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const bookingSchema = new mongoose.Schema({
    bookingId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userEmail: { type: String },
    userName: { type: String },
    movieId: { type: String, required: true },
    movieTitle: { type: String, required: true },
    posterUrl: { type: String },
    theatreId: { type: String, required: true },
    theatreName: { type: String, required: true },
    showtimeId: { type: String, required: true },
    showTime: { type: String, required: true },
    showDate: { type: String, default: 'Today' },
    seats: [{ type: String, required: true }],
    seatTier: { type: String, default: 'Gold' },
    subtotal: { type: Number, required: true },
    convenienceFee: { type: Number, default: 35 },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
    bookingStatus: { type: String, enum: ['Confirmed', 'Cancelled'], default: 'Confirmed' },
    bookedAt: { type: Date, default: Date.now }
  });

  module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
} else {
  module.exports = class MockBooking {};
}
