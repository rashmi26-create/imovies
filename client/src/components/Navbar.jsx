// client/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSearch }) {
  const { user, logout, setIsAuthModalOpen, setAuthMode } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="custom-navbar sticky-top">
      <div className="container-fluid d-flex align-items-center justify-content-between px-lg-4 px-3 py-2">
        {/* Brand */}
        <Link to="/" className="d-flex align-items-center text-decoration-none brand-link">
          <div className="brand-icon-box me-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="2" y1="7" x2="7" y2="7"></line>
              <line x1="2" y1="17" x2="7" y2="17"></line>
              <line x1="17" y1="17" x2="22" y2="17"></line>
              <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>
          </div>
          <div className="d-flex flex-column">
            <span className="brand-title">iMovies</span>
            <span className="brand-subtitle">CINEMA PASS</span>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="search-bar-wrapper mx-3 d-none d-md-flex align-items-center">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search Hindi & Hollywood movies, genres..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button className="btn-clear-search" onClick={clearSearch}>&times;</button>
          )}
        </div>

        {/* Nav Links & Actions */}
        <div className="d-flex align-items-center gap-2">
          <Link
            to="/"
            className={`nav-pill ${location.pathname === '/' ? 'active' : ''}`}
          >
            Movies
          </Link>
          <Link
            to="/my-bookings"
            className={`nav-pill ${location.pathname === '/my-bookings' ? 'active' : ''}`}
          >
            My Bookings
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`nav-pill ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              Admin
            </Link>
          )}

          {/* User Profile */}
          {user ? (
            <div className="dropdown">
              <div
                className="user-badge"
                role="button"
                data-bs-toggle="dropdown"
                onClick={() => {
                  if (confirm(`Logged in as ${user.name} (${user.email}). Sign out?`)) {
                    logout();
                    navigate('/');
                  }
                }}
                title="Click to Sign Out"
              >
                <div className="user-avatar">{getInitials(user.name)}</div>
                <span className="d-none d-sm-inline fw-semibold user-name">{user.name}</span>
                {user.role === 'admin' && <span className="admin-chip">ADMIN</span>}
              </div>
            </div>
          ) : (
            <button
              className="btn btn-signin"
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
