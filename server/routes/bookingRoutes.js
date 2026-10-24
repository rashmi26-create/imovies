// server/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');

router.post('/lock', bookingController.lockSeats);
router.post('/', verifyToken, bookingController.createBooking);
router.get('/user/:userId', verifyToken, bookingController.getUserBookings);
router.put('/cancel/:id', verifyToken, bookingController.cancelBooking);

module.exports = router;
