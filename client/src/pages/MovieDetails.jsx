// client/src/pages/MovieDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const [movieRes, showtimesRes] = await Promise.all([
        api.get(`/movies/${id}`),
        api.get(`/showtimes/movie/${id}`)
      ]);
      setMovie(movieRes.data);
      setShowtimes(showtimesRes.data);
    } catch (err) {
      console.error('Failed to load movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5 text-muted">Loading movie details & showtimes...</div>;
  if (!movie) return <div className="text-center py-5 text-muted">Movie not found.</div>;

  // Group showtimes by theater
  const groupedShowtimes = {};
  showtimes.forEach(st => {
    const tName = st.theaterName || 'PVR IMAX Metropolis';
    if (!groupedShowtimes[tName]) groupedShowtimes[tName] = [];
    groupedShowtimes[tName].push(st);
  });

  return (
    <div className="movie-details-container py-4">
      {/* Movie Top Showcase */}
      <div className="details-card-box p-4 rounded-4 mb-4 d-flex flex-column flex-md-row gap-4">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="details-poster rounded-3 flex-shrink-0"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'; }}
        />

        <div className="d-flex flex-column flex-grow-1">
          <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
            <span className="cert-tag">UA</span>
            <span className="rating-tag text-warning">★ {movie.rating || 4.9} / 5</span>
            <span className="lang-tag">{movie.language || 'Hindi'}</span>
            <span>{movie.duration} Mins</span>
          </div>

          <h2 className="display-6 fw-bold text-white mb-2">{movie.title}</h2>
          <p className="text-warning fw-semibold mb-3">{(movie.genre || []).join(', ')}</p>
          <p className="text-light text-opacity-75 mb-4 line-height-lg">{movie.description}</p>

          <div className="d-flex gap-3 mt-auto">
            <a
              href={movie.trailerUrl || 'https://www.youtube.com/embed/qD-6d8Wo3do'}
              target="_blank"
              rel="noreferrer"
              className="btn btn-glass px-4 py-2"
            >
              ▶ Watch Trailer
            </a>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="d-flex gap-2 mb-4">
        {['Today', 'Tomorrow'].map(d => (
          <button
            key={d}
            className={`date-tab-btn ${selectedDate === d ? 'active' : ''}`}
            onClick={() => setSelectedDate(d)}
          >
            <span className="fw-bold d-block">{d}</span>
            <span className="small opacity-75">{d === 'Today' ? '25 Oct' : '26 Oct'}</span>
          </button>
        ))}
      </div>

      {/* Theaters & Showtimes Listing */}
      <h4 className="fw-bold text-white mb-3">Available Showtimes</h4>
      {Object.keys(groupedShowtimes).length === 0 ? (
        <div className="text-muted p-4 rounded text-center border border-secondary border-opacity-25">
          No showtimes scheduled for this date. Check back soon!
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {Object.keys(groupedShowtimes).map(theater => (
            <div key={theater} className="theater-group-box p-3 rounded-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-white fw-bold mb-0">{theater}</h5>
                <span className="amenity-chip small">Dolby Atmos • 4K Laser</span>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {groupedShowtimes[theater].map(slot => (
                  <button
                    key={slot._id || slot.id}
                    className="slot-btn-box text-center p-2 rounded"
                    onClick={() => navigate(`/seat-matrix/${slot._id || slot.id}`)}
                  >
                    <span className="slot-time-text d-block fw-bold text-white">{slot.showTime}</span>
                    <span className="slot-price-text small text-muted">₹{slot.ticketPrice || 180}+</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
