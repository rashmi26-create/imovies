// server/routes/showtimeRoutes.js
const express = require('express');
const router = express.Router();
const showtimeController = require('../controllers/showtimeController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/movie/:movieId', showtimeController.getShowtimesByMovie);
router.get('/:id', showtimeController.getShowtimeById);
router.post('/', verifyToken, isAdmin, showtimeController.createShowtime);

module.exports = router;
