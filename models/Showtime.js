// models/Showtime.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const showtimeSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    theatreId: { type: String, required: true },
    theatreName: { type: String, required: true },
    time: { type: String, required: true },
    format: { type: String, default: 'Dolby Atmos' },
    date: { type: String, default: 'Today' },
    tierPrices: {
      Silver: { type: Number, default: 180 },
      Gold: { type: Number, default: 250 },
      Recliner: { type: Number, default: 360 }
    },
    bookedSeats: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  });

  module.exports = mongoose.models.Showtime || mongoose.model('Showtime', showtimeSchema);
} else {
  module.exports = class MockShowtime {};
}
