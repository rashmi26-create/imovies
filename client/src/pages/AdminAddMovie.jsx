// client/src/pages/AdminAddMovie.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminAddMovie() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [duration, setDuration] = useState('150');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [priceStarting, setPriceStarting] = useState('180');
  const [isTrending, setIsTrending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await api.get('/movies');
      setMovies(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const payload = {
        title,
        description,
        genre: genre.split(',').map(s => s.trim()),
        language,
        duration: Number(duration),
        posterUrl,
        trailerUrl: trailerUrl || 'https://www.youtube.com/embed/qD-6d8Wo3do',
        priceStarting: Number(priceStarting),
        isTrending: Boolean(isTrending)
      };

      await api.post('/movies', payload);
      setMsg({ text: `Film "${title}" successfully published to catalog!`, type: 'success' });
      setTitle('');
      setDescription('');
      setGenre('');
      setPosterUrl('');
      setTrailerUrl('');
      fetchMovies();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to add movie', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (movieId) => {
    if (!confirm('Are you sure you want to remove this movie from exhibition listings?')) return;

    try {
      await api.delete(`/movies/${movieId}`);
      setMsg({ text: 'Movie removed successfully.', type: 'info' });
      fetchMovies();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Delete failed', type: 'danger' });
    }
  };

  return (
    <div className="admin-page py-4">
      <div className="mb-4">
        <h2 className="fw-bold text-white mb-1">Exhibitor Admin Dashboard</h2>
        <p className="text-muted small">Publish new movies, manage schedules, and audit screen listings</p>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type} py-2 px-3 small mb-4`}>
          {msg.text}
        </div>
      )}

      {/* Add Movie Card Form */}
      <div className="admin-form-box p-4 rounded-4 mb-5">
        <h4 className="fw-bold text-white mb-3">Add New Film to Catalog</h4>

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small text-muted">Movie Title *</label>
              <input
                type="text"
                className="form-control custom-input"
                placeholder="e.g. Singham Again"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small text-muted">Language *</label>
              <select
                className="form-select custom-input"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="Hindi">Hindi (Bollywood)</option>
                <option value="English">English (Hollywood)</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small text-muted">Genres (comma separated) *</label>
              <input
                type="text"
                className="form-control custom-input"
                placeholder="Action, Drama, Thriller"
                value={genre}
                onChange={e => setGenre(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted">Duration (mins) *</label>
              <input
                type="number"
                className="form-control custom-input"
                placeholder="150"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted">Starting Ticket Price (₹) *</label>
              <input
                type="number"
                className="form-control custom-input"
                placeholder="180"
                value={priceStarting}
                onChange={e => setPriceStarting(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small text-muted">Poster Image URL *</label>
              <input
                type="url"
                className="form-control custom-input"
                placeholder="https://images.unsplash.com/..."
                value={posterUrl}
                onChange={e => setPosterUrl(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small text-muted">Trailer Video Embed URL</label>
              <input
                type="url"
                className="form-control custom-input"
                placeholder="https://www.youtube.com/embed/..."
                value={trailerUrl}
                onChange={e => setTrailerUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small text-muted">Synopsis & Plot *</label>
            <textarea
              className="form-control custom-input"
              rows="3"
              placeholder="Enter synopsis..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-check form-switch mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="trendingSwitch"
              checked={isTrending}
              onChange={e => setIsTrending(e.target.checked)}
            />
            <label className="form-check-label small text-muted" htmlFor="trendingSwitch">
              Promote to Blockbuster Trending Hero Banner
            </label>
          </div>

          <button type="submit" className="btn btn-primary-custom px-4 py-2 fw-semibold" disabled={loading}>
            {loading ? 'Publishing...' : 'Save & Publish Movie'}
          </button>
        </form>
      </div>

      {/* Catalog Listing Table */}
      <div className="admin-table-box p-4 rounded-4">
        <h4 className="fw-bold text-white mb-3">Existing Catalog Films ({movies.length})</h4>
        
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr className="border-secondary text-muted small">
                <th>Movie Title</th>
                <th>Language</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map(m => (
                <tr key={m._id || m.id} className="border-secondary border-opacity-25">
                  <td className="fw-semibold text-white">{m.title}</td>
                  <td><span className="lang-tag small">{m.language || 'Hindi'}</span></td>
                  <td className="small text-muted">{m.duration}m</td>
                  <td className="text-warning">₹{m.priceStarting || 180}</td>
                  <td className="text-warning">★ {m.rating}</td>
                  <td>{m.isTrending ? <span className="badge bg-danger">TRENDING</span> : <span className="badge bg-secondary">Catalog</span>}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(m._id || m.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
