// models/Movie.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    language: { type: String, required: true },
    genres: [{ type: String }],
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    certification: { type: String, enum: ['U', 'UA', 'A'], default: 'UA' },
    durationMins: { type: Number, required: true },
    releaseDate: { type: String },
    posterUrl: { type: String, required: true },
    bannerUrl: { type: String },
    trailerUrl: { type: String },
    synopsis: { type: String, required: true },
    cast: [{ type: String }],
    director: { type: String },
    isTrending: { type: Boolean, default: false },
    priceStarting: { type: Number, default: 180 },
    createdAt: { type: Date, default: Date.now }
  });

  module.exports = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
} else {
  module.exports = class MockMovie {};
}
