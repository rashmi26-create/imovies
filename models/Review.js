// models/Review.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const reviewSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    userId: { type: String },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  });

  module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
} else {
  module.exports = class MockReview {};
}
