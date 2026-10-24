// server/controllers/movieController.js
const { memoryStore, isMongoConnected } = require('../config/db');
let Movie;
try {
  Movie = require('../models/Movie');
} catch (e) {
  Movie = null;
}

exports.getAllMovies = async (req, res) => {
  try {
    const { genre, search, language, trending } = req.query;

    if (isMongoConnected() && Movie && Movie.find) {
      let filter = {};
      if (genre && genre !== 'All' && genre !== 'All Films') {
        filter.genre = { $in: [new RegExp(genre, 'i')] };
      }
      if (language && language !== 'All') {
        filter.language = new RegExp(`^${language}$`, 'i');
      }
      if (search) {
        filter.$or = [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { genre: new RegExp(search, 'i') }
        ];
      }
      if (trending === 'true') {
        filter.isTrending = true;
      }

      const movies = await Movie.find(filter).sort({ isTrending: -1, rating: -1 });
      return res.json(movies);
    }

    // Memory Store Fallback
    let list = [...memoryStore.movies];
    if (genre && genre !== 'All' && genre !== 'All Films') {
      list = list.filter(m => (m.genre || m.genres || []).some(g => g.toLowerCase() === genre.toLowerCase()));
    }
    if (language && language !== 'All') {
      list = list.filter(m => m.language && m.language.toLowerCase() === language.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.genre && m.genre.some(g => g.toLowerCase().includes(q)))
      );
    }
    if (trending === 'true') {
      list = list.filter(m => m.isTrending);
    }

    return res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving movie catalog', error: err.message });
  }
};

exports.getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected() && Movie && Movie.findById) {
      const movie = await Movie.findById(id);
      if (!movie) return res.status(404).json({ message: 'Movie not found' });
      return res.json(movie);
    }

    const movie = memoryStore.movies.find(m => (m._id || m.id) === id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    return res.json(movie);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving movie details', error: err.message });
  }
};

exports.createMovie = async (req, res) => {
  try {
    const { title, description, genre, duration, posterUrl, bannerUrl, trailerUrl, rating, language, isTrending, priceStarting } = req.body;

    if (!title || !description || !posterUrl || !duration) {
      return res.status(400).json({ message: 'Title, description, posterUrl, and duration are required.' });
    }

    const formattedGenre = Array.isArray(genre) ? genre : (genre ? genre.split(',').map(s => s.trim()) : ['Action']);

    if (isMongoConnected() && Movie) {
      const newMovie = new Movie({
        title,
        description,
        genre: formattedGenre,
        duration: Number(duration),
        posterUrl,
        bannerUrl: bannerUrl || posterUrl,
        trailerUrl: trailerUrl || 'https://www.youtube.com/embed/qD-6d8Wo3do',
        rating: rating ? Number(rating) : 4.8,
        language: language || 'Hindi',
        isTrending: Boolean(isTrending),
        priceStarting: priceStarting ? Number(priceStarting) : 180
      });
      await newMovie.save();
      return res.status(201).json(newMovie);
    }

    const newMovieMem = {
      _id: 'mov-' + Date.now(),
      id: 'mov-' + Date.now(),
      title,
      description,
      genre: formattedGenre,
      duration: Number(duration),
      posterUrl,
      bannerUrl: bannerUrl || posterUrl,
      trailerUrl: trailerUrl || 'https://www.youtube.com/embed/qD-6d8Wo3do',
      rating: rating ? Number(rating) : 4.8,
      language: language || 'Hindi',
      isTrending: Boolean(isTrending),
      priceStarting: priceStarting ? Number(priceStarting) : 180,
      createdAt: new Date().toISOString()
    };
    memoryStore.movies.unshift(newMovieMem);
    memoryStore.saveToDisk();

    return res.status(201).json(newMovieMem);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create movie listing', error: err.message });
  }
};

exports.deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected() && Movie && Movie.findByIdAndDelete) {
      const deleted = await Movie.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Movie not found' });
      return res.json({ message: 'Movie deleted successfully' });
    }

    const len = memoryStore.movies.length;
    memoryStore.movies = memoryStore.movies.filter(m => (m._id || m.id) !== id);
    if (memoryStore.movies.length === len) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    memoryStore.saveToDisk();
    return res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete movie', error: err.message });
  }
};
