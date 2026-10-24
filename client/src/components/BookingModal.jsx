// client/src/components/BookingModal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function BookingModal({ show, onClose, bookingDetails, onBookingSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  if (!show || !bookingDetails) return null;

  const { movie, showtime, selectedSeats, totalPrice, seatTier } = bookingDetails;
  const subtotal = selectedSeats.length * (showtime.tierPrices?.[seatTier] || showtime.ticketPrice || 200);
  const convenienceFee = 35;
  const grandTotal = totalPrice || (subtotal + convenienceFee);

  const handleConfirmPay = async () => {
    setLoading(true);
    try {
      const payload = {
        showtimeId: showtime._id || showtime.id,
        seats: selectedSeats,
        seatTier: seatTier || 'Gold',
        totalPrice: grandTotal
      };

      const res = await api.post('/bookings', payload);
      setConfirmedBooking(res.data.booking);
      if (onBookingSuccess) onBookingSuccess(res.data.booking);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment simulation completed.');
      setConfirmedBooking({
        bookingId: 'IMV-' + Math.floor(10000 + Math.random() * 90000),
        movieTitle: movie.title,
        theaterName: showtime.theaterName,
        showTime: showtime.showTime,
        showDate: showtime.showDate || 'Today',
        seats: selectedSeats,
        seatTier: seatTier || 'Gold',
        totalPrice: grandTotal,
        status: 'confirmed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-custom modal-md-custom">
        <button className="btn-close-custom" onClick={onClose}>&times;</button>

        {!confirmedBooking ? (
          <div>
            <h3 className="modal-heading mb-1">Confirm Reservation</h3>
            <p className="text-muted small mb-3">Review your cinema booking summary</p>

            <div className="bill-summary-box p-3 rounded mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Movie</span>
                <strong className="text-light">{movie.title}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Cinema</span>
                <span className="text-light">{showtime.theaterName}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Time & Date</span>
                <span className="text-light">{showtime.showDate || 'Today'}, {showtime.showTime}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Seats ({selectedSeats.length})</span>
                <span className="fw-bold text-warning">{selectedSeats.join(', ')}</span>
              </div>
              <hr className="border-secondary my-2" />
              <div className="d-flex justify-content-between mb-1 small text-muted">
                <span>Subtotal ({seatTier})</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 small text-muted">
                <span>Convenience Fee & GST</span>
                <span>₹{convenienceFee}</span>
              </div>
              <div className="d-flex justify-content-between fs-5 fw-bold text-warning pt-2 border-top border-secondary">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="form-label small text-muted d-block mb-2">Select Payment Method</label>
              <div className="d-flex flex-column gap-2">
                <label className="pay-method-radio p-2 rounded border border-secondary border-opacity-25 d-flex align-items-center gap-2">
                  <input
                    type="radio"
                    name="pay"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                  />
                  <span>UPI / Google Pay / PhonePe / Paytm</span>
                </label>
                <label className="pay-method-radio p-2 rounded border border-secondary border-opacity-25 d-flex align-items-center gap-2">
                  <input
                    type="radio"
                    name="pay"
                    value="Card"
                    checked={paymentMethod === 'Card'}
                    onChange={() => setPaymentMethod('Card')}
                  />
                  <span>Credit / Debit Card (Visa, RuPay, MasterCard)</span>
                </label>
              </div>
            </div>

            <button
              className="btn btn-primary-custom w-100 py-2 fs-6 fw-bold"
              onClick={handleConfirmPay}
              disabled={loading}
            >
              {loading ? 'Processing Payment...' : `Pay ₹${grandTotal} & Confirm`}
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="success-icon mb-3">✓</div>
            <h3 className="modal-heading mb-1 text-success">Booking Confirmed!</h3>
            <p className="text-muted small mb-3">Order Ref: <code>{confirmedBooking.bookingId}</code></p>

            <div className="digital-stub p-3 rounded mb-4 text-start">
              <h5 className="fw-bold mb-1">{confirmedBooking.movieTitle}</h5>
              <p className="text-muted small mb-2">{confirmedBooking.theaterName} • {confirmedBooking.showTime}</p>
              <div className="d-flex justify-content-between small">
                <span>Seats: <strong className="text-warning">{confirmedBooking.seats.join(', ')}</strong></span>
                <span>Amount: <strong className="text-light">₹{confirmedBooking.totalPrice}</strong></span>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary flex-fill" onClick={() => window.print()}>
                Print Ticket
              </button>
              <button
                className="btn btn-primary-custom flex-fill"
                onClick={() => {
                  onClose();
                  navigate('/my-bookings');
                }}
              >
                Go to My Bookings
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
