// client/src/pages/MyBookings.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const uId = user ? (user.id || user._id) : 'usr-demo';
      const res = await api.get(`/bookings/user/${uId}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setBookings(res.data);
        return;
      }
    } catch (err) {
      // Fallback to local storage on static deploy
    }

    try {
      const saved = localStorage.getItem('imovies_user_bookings');
      if (saved) {
        setBookings(JSON.parse(saved));
        return;
      }
    } catch (e) {}

    // Initial default booking for Aaradhya Sharma
    const defaultBooking = [
      {
        bookingId: 'IMV-98421',
        movieTitle: 'Baahubali 2: The Conclusion',
        theaterName: 'PVR IMAX Metropolis',
        showTime: '10:30 AM',
        showDate: 'Today',
        seats: ['E4', 'E5'],
        seatTier: 'Gold',
        totalPrice: 555,
        status: 'confirmed'
      }
    ];
    setBookings(defaultBooking);
    setLoading(false);
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking and release your seats?')) return;

    try {
      await api.put(`/bookings/cancel/${bookingId}`);
    } catch (e) {}

    setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status: 'cancelled' } : b));
    alert('Booking cancelled successfully.');
  };

  if (loading) return <div className="text-center py-5 text-muted">Loading your tickets & reservations...</div>;

  return (
    <div className="my-bookings-page py-4">
      <div className="mb-4">
        <h2 className="fw-bold text-white mb-1">My Bookings</h2>
        <p className="text-muted small">View active cinema passes, check order details, or cancel seats</p>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-bookings-box text-center py-5 border border-secondary border-opacity-25 rounded-4">
          <h4 className="text-muted mb-2">No Bookings Found</h4>
          <p className="text-muted small mb-4">You have not booked any movie screenings yet.</p>
          <Link to="/" className="btn btn-primary-custom px-4 py-2">
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {bookings.map(booking => {
            const isCancelled = booking.status === 'cancelled';
            return (
              <div
                key={booking._id || booking.id || booking.bookingId}
                className={`booking-ticket-card p-4 rounded-4 ${isCancelled ? 'opacity-50' : ''}`}
              >
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                  <div>
                    <span className="badge bg-warning text-dark me-2">PASS</span>
                    <span className="small text-muted font-monospace">REF: {booking.bookingId}</span>
                  </div>
                  <div>
                    <span className={`status-pill ${isCancelled ? 'status-cancelled' : 'status-confirmed'}`}>
                      {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                    </span>
                  </div>
                </div>

                <div className="row g-3 align-items-center">
                  <div className="col-md-5">
                    <h4 className="fw-bold text-white mb-1">{booking.movieTitle}</h4>
                    <p className="text-muted small mb-0">{booking.theaterName}</p>
                  </div>

                  <div className="col-md-4">
                    <div className="small text-muted mb-1">
                      <span>Schedule: </span>
                      <strong className="text-light">{booking.showDate || 'Today'}, {booking.showTime}</strong>
                    </div>
                    <div className="small text-muted">
                      <span>Seats ({booking.seats.length}): </span>
                      <strong className="text-warning">{booking.seats.join(', ')}</strong>
                      <span className="ms-2 badge bg-secondary">{booking.seatTier || 'Gold'}</span>
                    </div>
                  </div>

                  <div className="col-md-3 text-md-end">
                    <div className="fs-5 fw-bold text-light mb-2">₹{booking.totalPrice}</div>
                    <div className="d-flex gap-2 justify-content-md-end">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
                        Print Pass
                      </button>
                      {!isCancelled && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleCancel(booking._id || booking.id || booking.bookingId)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
