// server/models/Movie.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    genre: [{ type: String, required: true }],
    duration: { type: Number, required: true }, // in minutes
    releaseDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    posterUrl: { type: String, required: true },
    bannerUrl: { type: String },
    trailerUrl: { type: String },
    rating: { type: Number, default: 4.5, min: 0, max: 10 },
    language: { type: String, default: 'Hindi' },
    isTrending: { type: Boolean, default: false },
    priceStarting: { type: Number, default: 180 }
  }, { timestamps: true });

  module.exports = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
} else {
  module.exports = class MockMovie {};
}
