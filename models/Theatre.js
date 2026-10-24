// models/Theatre.js
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

if (mongoose && mongoose.Schema) {
  const theatreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    amenities: [{ type: String }],
    formats: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  });

  module.exports = mongoose.models.Theatre || mongoose.model('Theatre', theatreSchema);
} else {
  module.exports = class MockTheatre {};
}
