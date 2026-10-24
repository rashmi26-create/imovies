// server/routes/movieRoutes.js
const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieById);
router.post('/', verifyToken, isAdmin, movieController.createMovie);
router.delete('/:id', verifyToken, isAdmin, movieController.deleteMovie);

module.exports = router;
