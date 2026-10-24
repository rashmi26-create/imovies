// client/src/components/AuthModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authMode, setAuthMode, login, register, demoLogin } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let res;
    if (authMode === 'login') {
      res = await login(email, password);
    } else {
      res = await register(name, email, password);
    }

    setLoading(false);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-custom">
        <button className="btn-close-custom" onClick={() => setIsAuthModalOpen(false)}>&times;</button>
        
        {/* Tab Switcher */}
        <div className="auth-tabs-row mb-4">
          <button
            className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && <div className="alert alert-danger py-2 px-3 small mb-3">{error}</div>}

        <form onSubmit={handleSubmit}>
          {authMode === 'register' && (
            <div className="mb-3">
              <label className="form-label small text-muted">Full Name</label>
              <input
                type="text"
                className="form-control custom-input"
                placeholder="Aaradhya Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label small text-muted">Email Address</label>
            <input
              type="email"
              className="form-control custom-input"
              placeholder="aaradhya.sharma@imovies.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small text-muted">Password</label>
            <input
              type="password"
              className="form-control custom-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary-custom w-100 py-2 mb-3" disabled={loading}>
            {loading ? 'Please wait...' : authMode === 'login' ? 'Sign In to iMovies' : 'Create Account'}
          </button>
        </form>

        {/* Quick Fill Demo Access */}
        <div className="demo-box pt-3 mt-3 border-top border-secondary border-opacity-25 text-center">
          <span className="small text-muted d-block mb-2">1-Click Instant Demo Credentials:</span>
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-outline-warning btn-sm"
              onClick={() => demoLogin('user')}
            >
              Aaradhya Sharma (User)
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => demoLogin('admin')}
            >
              Exhibitor Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
