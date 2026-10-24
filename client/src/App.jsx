// client/src/App.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SeatMatrix from './pages/SeatMatrix';
import MyBookings from './pages/MyBookings';
import AdminAddMovie from './pages/AdminAddMovie';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="app-layout d-flex flex-column min-vh-100">
      <Navbar onSearch={q => setSearchQuery(q)} />
      
      <main className="container-fluid px-lg-4 px-3 flex-grow-1">
        <Routes>
          <Route path="/" element={<Home searchQuery={searchQuery} />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/seat-matrix/:showtimeId" element={<SeatMatrix />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/admin" element={<AdminAddMovie />} />
        </Routes>
      </main>

      <AuthModal />

      <footer className="footer-custom py-4 border-top border-secondary border-opacity-25 mt-5">
        <div className="container-fluid text-center text-muted small">
          <p className="mb-1">
            🎬 <strong className="text-light">iMovies</strong> — Seamless Movie Ticket Booking Platform (MERN Stack)
          </p>
          <p className="mb-0 text-muted text-opacity-75">
            Designed for high performance cinema ticketing with real-time seat availability tracking.
          </p>
        </div>
      </footer>
    </div>
  );
}
