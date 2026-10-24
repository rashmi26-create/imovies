// client/src/pages/SeatMatrix.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import BookingModal from '../components/BookingModal';
import { initialMovies, initialShowtimes } from '../data/initialData';

export default function SeatMatrix() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  const [showtime, setShowtime] = useState(null);
  const [movie, setMovie] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTier, setSelectedTier] = useState('Gold');
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes transient lock
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShowtime();
  }, [showtimeId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('Seat lock session expired. Please reselect your seats.');
          setSelectedSeats([]);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchShowtime = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/showtimes/${showtimeId}`);
      setShowtime(res.data);
      if (res.data.movieId) {
        if (typeof res.data.movieId === 'object') {
          setMovie(res.data.movieId);
        } else {
          const mRes = await api.get(`/movies/${res.data.movieId}`);
          setMovie(mRes.data);
        }
      }
    } catch (err) {
      // High-resilience fallback for Vercel
      const fbShowtime = initialShowtimes.find(s => s._id === showtimeId || s.id === showtimeId) || initialShowtimes[0];
      setShowtime(fbShowtime);
      setMovie(initialMovies[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.isBooked) return;

    const sNum = seat.seatNumber;
    if (selectedSeats.includes(sNum)) {
      setSelectedSeats(selectedSeats.filter(s => s !== sNum));
    } else {
      if (selectedSeats.length >= 8) {
        alert('Maximum 8 seats allowed per booking');
        return;
      }
      setSelectedSeats([...selectedSeats, sNum]);
      setSelectedTier(seat.tier || 'Gold');
    }
  };

  if (loading) return <div className="text-center py-5 text-muted">Loading theater auditorium grid...</div>;
  if (!showtime) return <div className="text-center py-5 text-muted">Showtime not found.</div>;

  const currentMovieTitle = movie ? movie.title : 'Baahubali 2: The Conclusion';
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // 8 rows
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Tier base price
  const tierPrice = showtime.tierPrices?.[selectedTier] || showtime.ticketPrice || 200;
  const subtotal = selectedSeats.length * tierPrice;
  const grandTotal = subtotal > 0 ? subtotal + 35 : 0;

  return (
    <div className="seat-matrix-page py-4">
      {/* Header bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25 gap-3">
        <div>
          <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h3 className="fw-bold text-white mb-1">{currentMovieTitle}</h3>
          <p className="text-muted small mb-0">
            {showtime.theaterName} • {showtime.showDate || 'Today'}, {showtime.showTime} • {showtime.format || 'Dolby Atmos'}
          </p>
        </div>

        {/* 10-Minute Seat Lock Timer */}
        <div className="timer-pill-box d-flex align-items-center gap-2 px-3 py-2 rounded-pill">
          <span className="small text-danger fw-bold">Seat Hold:</span>
          <span className="font-monospace fw-bold text-white fs-5">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Screen Graphic with Glow */}
      <div className="theater-screen-wrapper text-center my-4">
        <div className="screen-curve-glow mx-auto mb-2"></div>
        <span className="screen-caption-text small text-muted text-uppercase tracking-wider">
          ALL EYES THIS WAY (CINEMA SCREEN)
        </span>
      </div>

      {/* Seat Legend */}
      <div className="d-flex justify-content-center gap-4 mb-4 small text-muted">
        <div className="d-flex align-items-center gap-2">
          <span className="legend-seat-sample available"></span> Available
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="legend-seat-sample selected"></span> Selected
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="legend-seat-sample booked"></span> Booked
        </div>
      </div>

      {/* 8x10 Theater Grid */}
      <div className="seat-grid-box p-3 rounded-4 mb-4 text-center overflow-auto">
        {rows.map(rowLetter => {
          let tierName = 'Prime Gold (₹250)';
          if (rowLetter === 'A' || rowLetter === 'B') tierName = 'VIP Recliner (₹380)';
          if (rowLetter === 'F' || rowLetter === 'G' || rowLetter === 'H') tierName = 'Classic Silver (₹180)';

          return (
            <div key={rowLetter} className="seat-row-wrapper mb-2">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <span className="row-letter-tag text-muted fw-bold">{rowLetter}</span>
                
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(colNum => {
                  const sNumber = `${rowLetter}${colNum}`;
                  const isSelected = selectedSeats.includes(sNumber);
                  const seatData = showtime.seats?.find(s => s.seatNumber === sNumber);
                  const isBooked = seatData ? seatData.isBooked : ['A3', 'A4', 'C5', 'E8'].includes(sNumber);

                  return (
                    <button
                      key={sNumber}
                      type="button"
                      className={`seat-btn-cell ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                      disabled={isBooked}
                      onClick={() => handleSeatClick({ seatNumber: sNumber, isBooked, tier: rowLetter <= 'B' ? 'Recliner' : rowLetter <= 'E' ? 'Gold' : 'Silver' })}
                      title={`${sNumber} (${tierName})`}
                    >
                      {colNum}
                    </button>
                  );
                })}

                <span className="row-letter-tag text-muted fw-bold">{rowLetter}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="bottom-checkout-bar p-3 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <span className="small text-muted d-block">Selected Seats:</span>
          <strong className="text-white fs-6">
            {selectedSeats.length > 0 ? `${selectedSeats.join(', ')} (${selectedSeats.length} seats)` : 'None'}
          </strong>
        </div>

        <div>
          <span className="small text-muted d-block">Total Price:</span>
          <strong className="text-warning fs-4">₹{grandTotal}</strong>
        </div>

        <button
          className="btn btn-primary-custom px-4 py-2 fs-6 fw-bold"
          disabled={selectedSeats.length === 0}
          onClick={() => setShowBookingModal(true)}
        >
          Proceed to Pay
        </button>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <BookingModal
          show={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          bookingDetails={{
            movie: movie || { title: currentMovieTitle },
            showtime,
            selectedSeats,
            seatTier: selectedTier,
            totalPrice: grandTotal
          }}
          onBookingSuccess={() => {
            fetchShowtime();
            setSelectedSeats([]);
          }}
        />
      )}
    </div>
  );
}
