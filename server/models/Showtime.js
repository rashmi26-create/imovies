// server/models/Showtime.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const seatSchema = new mongoose.Schema({
    seatNumber: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    tier: { type: String, enum: ['Silver', 'Gold', 'Recliner'], default: 'Gold' },
    price: { type: Number, default: 200 },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: String, default: null }
  }, { _id: false });

  const showtimeSchema = new mongoose.Schema({
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theaterName: { type: String, required: true },
    showTime: { type: String, required: true },
    showDate: { type: String, default: 'Today' },
    format: { type: String, default: 'Dolby Atmos' },
    ticketPrice: { type: Number, required: true },
    tierPrices: {
      Silver: { type: Number, default: 180 },
      Gold: { type: Number, default: 250 },
      Recliner: { type: Number, default: 360 }
    },
    seats: [seatSchema]
  }, { timestamps: true });

  module.exports = mongoose.models.Showtime || mongoose.model('Showtime', showtimeSchema);
} else {
  module.exports = class MockShowtime {};
}
