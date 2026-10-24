// client/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { initialMovies } from '../data/initialData';

const GENRES = ['All Films', 'Action', 'Drama', 'Horror', 'Comedy', 'Sci-Fi', 'Adventure', 'Biography'];

export default function Home({ searchQuery = '' }) {
  const [movies, setMovies] = useState(initialMovies);
  const [selectedGenre, setSelectedGenre] = useState('All Films');
  const [selectedLang, setSelectedLang] = useState('All');
  const [loading, setLoading] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
  }, [selectedGenre, selectedLang, searchQuery]);

  const fetchMovies = async () => {
    try {
      const params = {};
      if (selectedGenre !== 'All Films') params.genre = selectedGenre;
      if (selectedLang !== 'All') params.language = selectedLang;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/movies', { params });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setMovies(res.data);
        return;
      }
    } catch (err) {
      // Backend not yet reachable on static deploy - filter initial dataset
    }

    // High-resilience client-side filtering
    let filtered = [...initialMovies];
    if (selectedGenre !== 'All Films') {
      filtered = filtered.filter(m => (m.genre || []).some(g => g.toLowerCase() === selectedGenre.toLowerCase()));
    }
    if (selectedLang !== 'All') {
      filtered = filtered.filter(m => m.language?.toLowerCase() === selectedLang.toLowerCase());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.genre || []).some(g => g.toLowerCase().includes(q))
      );
    }
    setMovies(filtered);
  };

  const heroMovie = movies.find(m => m.isTrending) || movies[0] || initialMovies[0];

  return (
    <div className="home-container">
      {/* Hero Banner (Baahubali 2) */}
      {heroMovie && (
        <section className="hero-banner-section mb-5 position-relative rounded-4 overflow-hidden">
          <div
            className="hero-backdrop-img position-absolute w-100 h-100"
            style={{ backgroundImage: `url(${heroMovie.bannerUrl || heroMovie.posterUrl})` }}
          />
          <div className="hero-gradient-overlay position-absolute w-100 h-100" />

          <div className="hero-content-wrapper position-relative p-4 p-md-5 d-flex flex-column justify-content-end">
            <div className="hero-badge-pill mb-2">
              <span className="pulse-dot"></span> BLOCKBUSTER TRENDING
            </div>

            <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
              <span className="cert-tag">UA</span>
              <span className="rating-tag text-warning">★ {heroMovie.rating || 4.9}</span>
              <span className="lang-tag">{heroMovie.language || 'Hindi'}</span>
              <span>{Math.floor((heroMovie.duration || 167) / 60)}h {(heroMovie.duration || 167) % 60}m</span>
            </div>

            <h1 className="hero-heading display-4 fw-bold text-white mb-2">{heroMovie.title}</h1>
            <p className="hero-genres-sub text-warning fw-semibold mb-3">
              {(heroMovie.genre || []).join(' • ')}
            </p>
            <p className="hero-desc-text text-light text-opacity-75 mb-4 col-lg-7 col-md-9 col-12">
              {heroMovie.description}
            </p>

            <div className="d-flex align-items-center gap-3">
              <button
                className="btn btn-primary-custom px-4 py-2 fs-6 fw-semibold"
                onClick={() => navigate(`/movie/${heroMovie._id || heroMovie.id}`)}
              >
                Book Tickets
              </button>
              <button
                className="btn btn-glass px-4 py-2 fs-6"
                onClick={() => setShowTrailerModal(true)}
              >
                ▶ Watch Trailer
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Trailer Modal */}
      {showTrailerModal && heroMovie && (
        <div className="modal-backdrop-custom" onClick={() => setShowTrailerModal(false)}>
          <div className="modal-dialog-custom modal-lg-custom p-2" onClick={e => e.stopPropagation()}>
            <button className="btn-close-custom" onClick={() => setShowTrailerModal(false)}>&times;</button>
            <div className="ratio ratio-16x9">
              <iframe
                src={`${heroMovie.trailerUrl || 'https://www.youtube.com/embed/qD-6d8Wo3do'}?autoplay=1`}
                title={`${heroMovie.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Row: Language & Genres */}
      <section className="catalog-section mb-5">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h2 className="section-title fw-bold text-white mb-1">Now Showing</h2>
            <p className="text-muted small mb-0">Select a movie to browse theater showtimes and seat availability</p>
          </div>

          {/* Language Switcher */}
          <div className="lang-selector-group d-flex align-items-center gap-2">
            <span className="small text-muted me-1">Language:</span>
            {['All', 'Hindi', 'English'].map(lang => (
              <button
                key={lang}
                className={`lang-pill-btn ${selectedLang === lang ? 'active' : ''}`}
                onClick={() => setSelectedLang(lang)}
              >
                {lang === 'All' ? 'All' : lang === 'Hindi' ? 'Hindi (Bollywood)' : 'English (Hollywood)'}
              </button>
            ))}
          </div>
        </div>

        {/* Genre Chips */}
        <div className="genre-scroll-bar d-flex gap-2 pb-3 mb-4">
          {GENRES.map(g => (
            <button
              key={g}
              className={`genre-chip-btn ${selectedGenre === g ? 'active' : ''}`}
              onClick={() => setSelectedGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Movie Cards Grid */}
        {movies.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted">No movies matching your selection</h4>
            <button className="btn btn-outline-warning mt-3" onClick={() => { setSelectedGenre('All Films'); setSelectedLang('All'); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
            {movies.map(movie => (
              <div key={movie._id || movie.id} className="col">
                <div className="movie-card-box h-100 d-flex flex-column rounded-3 overflow-hidden">
                  <div className="poster-box position-relative">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="poster-img w-100"
                      loading="lazy"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'; }}
                    />
                    <div className="card-rating-tag position-absolute">
                      ★ {movie.rating}
                    </div>
                  </div>

                  <div className="p-3 d-flex flex-column flex-grow-1">
                    <h5 className="movie-card-title text-white fw-bold mb-1 text-truncate" title={movie.title}>
                      {movie.title}
                    </h5>
                    <p className="small text-muted mb-3 text-truncate">
                      {(movie.genre || []).join(', ')} • {movie.duration}m
                    </p>

                    <div className="d-flex align-items-center justify-content-between mt-auto">
                      <span className="lang-tag small">{movie.language || 'Hindi'}</span>
                      <button
                        className="btn btn-book-sm"
                        onClick={() => navigate(`/movie/${movie._id || movie.id}`)}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
