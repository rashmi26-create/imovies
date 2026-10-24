// IMovies Client Application Engine
const API_BASE = '/api';

// Application State
const state = {
  movies: [],
  theatres: [],
  showtimes: [],
  tickets: [],
  watchlist: ['mov-1', 'mov-2'],
  user: {
    id: 'usr-demo',
    name: 'Aaradhya Sharma',
    email: 'aaradhya.sharma@imovies.com',
    role: 'user'
  },
  activeTab: 'movies',
  filters: {
    search: '',
    language: 'All',
    genre: 'All',
    city: 'Metro City'
  },
  currentHeroMovie: null,
  selectedMovie: null,
  selectedShowDate: 'Today',
  currentBooking: {
    movie: null,
    theatre: null,
    showtime: null,
    selectedSeats: [],
    seatTier: 'Gold',
    basePrice: 200,
    subtotal: 0,
    fee: 35,
    total: 0
  },
  seatTimer: null,
  seatSecondsRemaining: 600,
  activeReviewRating: 5
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalSession();
  await loadData();
  setupUI();
  renderApp();
});

function loadLocalSession() {
  try {
    const savedUser = localStorage.getItem('imovies_user');
    if (savedUser) {
      state.user = JSON.parse(savedUser);
      // Auto-migrate legacy demo username to Aaradhya Sharma
      if (state.user && state.user.name === 'Alex Rivera') {
        state.user.name = 'Aaradhya Sharma';
        state.user.email = 'aaradhya.sharma@imovies.com';
        localStorage.setItem('imovies_user', JSON.stringify(state.user));
      }
    }
    const savedWatchlist = localStorage.getItem('imovies_watchlist');
    if (savedWatchlist) {
      state.watchlist = JSON.parse(savedWatchlist);
    }
  } catch (e) {
    console.warn('Session load failed:', e);
  }
}

function saveLocalSession() {
  try {
    localStorage.setItem('imovies_user', JSON.stringify(state.user));
    localStorage.setItem('imovies_watchlist', JSON.stringify(state.watchlist));
  } catch (e) {
    // Ignore storage errors
  }
}

// Fetch Initial Data with Zero-Crash Resilience
async function loadData() {
  try {
    const [moviesRes, theatresRes, showtimesRes, bookingsRes] = await Promise.all([
      fetch(`${API_BASE}/movies`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/theatres`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/showtimes`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/bookings/user/${state.user ? state.user.id : 'all'}`).then(r => r.json()).catch(() => null)
    ]);

    if (moviesRes && moviesRes.movies) {
      state.movies = moviesRes.movies;
    }
    if (theatresRes && theatresRes.theatres) {
      state.theatres = theatresRes.theatres;
    }
    if (showtimesRes && showtimesRes.showtimes) {
      state.showtimes = showtimesRes.showtimes;
    }
    if (bookingsRes && bookingsRes.bookings) {
      state.tickets = bookingsRes.bookings;
    }
  } catch (err) {
    console.warn('Backend unavailable, running in standalone browser mode:', err);
  }

  // Set default Hero Movie (Trending)
  const trending = state.movies.find(m => m.isTrending) || state.movies[0];
  state.currentHeroMovie = trending;
}

function setupUI() {
  updateAuthUI();
  updateBadges();

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      stopSeatTimer();
    }
  });

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        if (modal.id === 'seatModal') stopSeatTimer();
        if (modal.id === 'trailerModal') closeTrailerModal();
      }
    });
  });
}

function renderApp() {
  renderHeroBanner();
  renderMovieGrid();
  renderVenuesShowcase();
  renderCinemasList();
  renderTicketsList();
  renderWatchlist();
  if (state.activeTab === 'admin') {
    renderAdminDashboard();
  }
}

// ==================== NAVIGATION ====================
function navigateTo(tab) {
  state.activeTab = tab;

  // Update navbar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tab);
  });

  // Switch panels
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  const targetPanel = document.getElementById(`view-${tab}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tab === 'admin') {
    renderAdminDashboard();
  } else if (tab === 'tickets') {
    renderTicketsList();
  } else if (tab === 'watchlist') {
    renderWatchlist();
  }
}

// ==================== HERO BANNER ====================
function renderHeroBanner() {
  const m = state.currentHeroMovie;
  if (!m) return;

  const backdrop = document.getElementById('heroBackdrop');
  backdrop.style.backgroundImage = `url('${m.bannerUrl || m.posterUrl}')`;

  document.getElementById('heroTitle').textContent = m.title;
  document.getElementById('heroGenres').textContent = m.genres.join(' • ');
  document.getElementById('heroSynopsis').textContent = m.synopsis;
  document.getElementById('heroRating').textContent = m.rating;
  document.getElementById('heroCert').textContent = m.certification;
  document.getElementById('heroLang').textContent = `${m.language}`;
  document.getElementById('heroDuration').textContent = `${Math.floor(m.durationMins / 60)}h ${m.durationMins % 60}m`;

  const heroSaveBtn = document.getElementById('heroSaveBtn');
  const isSaved = state.watchlist.includes(m.id);
  heroSaveBtn.classList.toggle('active', isSaved);

  const heroBookBtn = document.getElementById('heroBookBtn');
  heroBookBtn.onclick = () => openShowtimeModal(m.id);
}

// ==================== MOVIE CATALOG & FILTERS ====================
function renderMovieGrid() {
  const grid = document.getElementById('movieGrid');
  const emptyState = document.getElementById('emptyMoviesState');

  let list = [...state.movies];

  // Search Filter
  if (state.filters.search.trim()) {
    const q = state.filters.search.toLowerCase();
    list = list.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q)) ||
      m.language.toLowerCase().includes(q) ||
      (m.cast && m.cast.some(c => c.toLowerCase().includes(q))) ||
      (m.director && m.director.toLowerCase().includes(q))
    );
  }

  // Language Filter
  if (state.filters.language !== 'All') {
    list = list.filter(m => m.language.toLowerCase() === state.filters.language.toLowerCase());
  }

  // Genre Filter
  if (state.filters.genre !== 'All' && state.filters.genre !== 'All Films') {
    list = list.filter(m =>
      m.genres.some(g => g.toLowerCase() === state.filters.genre.toLowerCase())
    );
  }

  if (list.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  grid.innerHTML = list.map(movie => {
    const isSaved = state.watchlist.includes(movie.id);
    const duration = `${Math.floor(movie.durationMins / 60)}h ${movie.durationMins % 60}m`;

    return `
      <div class="movie-card">
        <div class="movie-poster-box">
          <img class="movie-poster-img" src="${movie.posterUrl}" alt="${movie.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'">
          
          <button class="card-save-btn ${isSaved ? 'active' : ''}" onclick="toggleWatchlist('${movie.id}', event)" title="Save to Watchlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          <div class="card-rating-badge">
            ★ ${movie.rating}
          </div>
        </div>

        <div class="movie-info">
          <h3 class="movie-title" title="${movie.title}">${movie.title}</h3>
          <p class="movie-genres-text">${movie.genres.join(', ')} • ${duration}</p>
          
          <div class="movie-footer-row">
            <div class="card-cert-meta">
              <span class="cert-pill">${movie.certification}</span>
              <span class="lang-tag">${movie.language}</span>
            </div>
            <button class="card-book-btn" onclick="openShowtimeModal('${movie.id}')">Book</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Filter Event Handlers
function handleSearch(val) {
  state.filters.search = val;
  const clearBtn = document.getElementById('clearSearchBtn');
  clearBtn.classList.toggle('hidden', !val);
  renderMovieGrid();
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  handleSearch('');
}

function setLanguageFilter(lang) {
  state.filters.language = lang;
  document.querySelectorAll('.lang-pills .pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  renderMovieGrid();
}

function setGenreFilter(genre) {
  state.filters.genre = genre;
  document.querySelectorAll('.genre-chip').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-genre') === genre);
  });
  renderMovieGrid();
}

function handleCityChange(city) {
  state.filters.city = city;
  showToast(`Location set to: ${city}`, 'info');
  renderVenuesShowcase();
  renderCinemasList();
}

function resetFilters() {
  state.filters.search = '';
  state.filters.language = 'All';
  state.filters.genre = 'All';
  document.getElementById('searchInput').value = '';
  document.getElementById('clearSearchBtn').classList.add('hidden');
  setLanguageFilter('All');
  setGenreFilter('All');
}

// ==================== VENUES & CINEMAS SHOWCASE ====================
function renderVenuesShowcase() {
  const container = document.getElementById('venuesGrid');
  if (!container) return;

  let venues = [...state.theatres];
  if (state.filters.city && state.filters.city !== 'Metro City') {
    venues = venues.filter(v => v.city === state.filters.city || v.city === 'Metro City');
  }

  container.innerHTML = venues.slice(0, 3).map(venue => `
    <div class="venue-card">
      <h4 class="venue-name">${venue.name}</h4>
      <p class="venue-address">${venue.address}, ${venue.city}</p>
      <div class="amenity-tags">
        ${venue.amenities.map(a => `<span class="amenity-pill">${a}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderCinemasList() {
  const container = document.getElementById('cinemasList');
  if (!container) return;

  container.innerHTML = state.theatres.map(venue => `
    <div class="theatre-card" style="margin-bottom: 20px; padding: 24px;">
      <div class="theatre-head">
        <div>
          <h3 class="th-name" style="font-size: 1.25rem;">${venue.name}</h3>
          <p class="venue-address">${venue.address} • <strong style="color: var(--accent-gold);">${venue.city}</strong></p>
        </div>
        <span class="th-format">Certified Premium Venue</span>
      </div>
      <div class="amenity-tags" style="margin: 14px 0;">
        ${venue.amenities.map(a => `<span class="amenity-pill" style="padding: 4px 10px; font-size: 0.8rem;">${a}</span>`).join('')}
      </div>
      <button class="btn btn-outline btn-sm" onclick="navigateTo('movies')">Browse Screenings</button>
    </div>
  `).join('');
}

// ==================== SHOWTIMES & MOVIE MODAL ====================
async function openShowtimeModal(movieId) {
  const movie = state.movies.find(m => m.id === movieId);
  if (!movie) return;

  state.selectedMovie = movie;

  // Populate Header (Matching User Screenshot Layout)
  const header = document.getElementById('modalMovieHeader');
  header.innerHTML = `
    <img class="modal-thumb" src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'">
    <div class="modal-details">
      <div class="modal-badges-row">
        <span class="cert-pill">${movie.certification}</span>
        <span class="rating-badge">★ ${movie.rating} / 5</span>
        <span class="lang-tag">${movie.language}</span>
        <span class="duration-text">${movie.durationMins} Mins</span>
      </div>
      <h2 class="modal-title-text">${movie.title}</h2>
      <p class="modal-synopsis-text">${movie.synopsis}</p>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button class="btn btn-glass btn-sm" onclick="playTrailer('${movie.trailerUrl}', '${movie.title.replace(/'/g, "\\'")}')">
          ▶ Watch Trailer
        </button>
        <button class="btn btn-outline btn-sm" onclick="toggleWatchlist('${movie.id}')">
          ♥ Save to Watchlist
        </button>
      </div>
    </div>
  `;

  // Render Showtimes for Selected Date
  renderModalShowtimes();

  // Render Reviews
  await renderModalReviews(movieId);

  openModal('showtimeModal');
}

function selectShowDate(date) {
  state.selectedShowDate = date;
  document.querySelectorAll('.date-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-date') === date);
  });
  document.getElementById('selectedDateLabel').textContent = date;
  renderModalShowtimes();
}

function renderModalShowtimes() {
  const container = document.getElementById('modalShowtimesContainer');
  const movie = state.selectedMovie;
  if (!movie || !container) return;

  // Filter showtimes for this movie
  let movieShowtimes = state.showtimes.filter(s => s.movieId === movie.id);

  // If no custom showtimes exist for this movie, generate standard multiplex slots dynamically
  if (movieShowtimes.length === 0) {
    movieShowtimes = [
      {
        id: `st-gen-1-${movie.id}`,
        movieId: movie.id,
        theatreId: 'th-1',
        theatreName: 'PVR IMAX Metropolis',
        time: '10:30 AM',
        format: 'IMAX 3D',
        tierPrices: { Silver: movie.priceStarting, Gold: movie.priceStarting + 80, Recliner: movie.priceStarting + 180 },
        bookedSeats: ['A3', 'A4', 'C6', 'D7']
      },
      {
        id: `st-gen-2-${movie.id}`,
        movieId: movie.id,
        theatreId: 'th-1',
        theatreName: 'PVR IMAX Metropolis',
        time: '02:15 PM',
        format: 'IMAX 3D',
        tierPrices: { Silver: movie.priceStarting + 20, Gold: movie.priceStarting + 100, Recliner: movie.priceStarting + 200 },
        bookedSeats: ['B1', 'B2', 'E4', 'E5']
      },
      {
        id: `st-gen-3-${movie.id}`,
        movieId: movie.id,
        theatreId: 'th-2',
        theatreName: 'INOX Megaplex Dolby Atmos',
        time: '06:30 PM',
        format: 'Dolby Atmos',
        tierPrices: { Silver: movie.priceStarting - 10, Gold: movie.priceStarting + 60, Recliner: movie.priceStarting + 150 },
        bookedSeats: ['C1', 'C2', 'F7', 'F8']
      }
    ];
  }

  // Group showtimes by Theatre Name
  const grouped = {};
  movieShowtimes.forEach(st => {
    if (!grouped[st.theatreName]) grouped[st.theatreName] = [];
    grouped[st.theatreName].push(st);
  });

  container.innerHTML = Object.keys(grouped).map(thName => {
    const slots = grouped[thName];
    return `
      <div class="theatre-card">
        <div class="theatre-head">
          <span class="th-name">${thName}</span>
          <span class="th-format">${slots[0].format || 'Dolby Atmos 4K'}</span>
        </div>
        <div class="slots-grid">
          ${slots.map(slot => `
            <button class="slot-btn" onclick="startSeatSelection('${slot.id}', '${thName.replace(/'/g, "\\'")}', '${slot.time}', '${slot.format}')">
              <span class="slot-time">${slot.time}</span>
              <span class="slot-price">₹${slot.tierPrices ? slot.tierPrices.Silver : 180}+</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ==================== REVIEWS SYSTEM ====================
async function renderModalReviews(movieId) {
  const container = document.getElementById('modalReviewsContainer');
  const countLabel = document.getElementById('reviewsCountLabel');

  try {
    const res = await fetch(`${API_BASE}/reviews/movie/${movieId}`).then(r => r.json()).catch(() => null);
    const reviews = (res && res.reviews) ? res.reviews : [];

    countLabel.textContent = `Audience Reviews (${reviews.length})`;

    if (reviews.length === 0) {
      container.innerHTML = `
        <p style="color: var(--text-dim); font-size: 0.88rem; padding: 12px 0;">
          No reviews written yet. Be the first to share your thoughts on this movie!
        </p>
      `;
      return;
    }

    container.innerHTML = reviews.map(r => `
      <div class="review-item">
        <div class="review-author-row">
          <span class="review-author">${r.userName}</span>
          <span class="review-stars">★ ${r.rating} / 5</span>
        </div>
        <p class="review-comment">${r.comment}</p>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p class="review-comment">Reviews loaded.</p>';
  }
}

function openWriteReviewModal() {
  if (!state.selectedMovie) return;
  document.getElementById('reviewMovieTitle').textContent = `Reviewing "${state.selectedMovie.title}"`;
  document.getElementById('reviewAuthor').value = state.user ? state.user.name : 'Cinema Patron';
  document.getElementById('reviewComment').value = '';
  setStarRating(5);
  openModal('reviewModal');
}

function setStarRating(rating) {
  state.activeReviewRating = rating;
  const stars = document.querySelectorAll('#starRatingSelect .star-opt');
  stars.forEach((star, index) => {
    star.classList.toggle('active', index < rating);
  });
}

async function submitReview() {
  const comment = document.getElementById('reviewComment').value.trim();
  const userName = document.getElementById('reviewAuthor').value.trim() || 'Movie Lover';

  if (!comment) {
    showToast('Please provide your review feedback before submitting', 'error');
    return;
  }

  try {
    await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId: state.selectedMovie.id,
        userName,
        rating: state.activeReviewRating,
        comment
      })
    });
    showToast('Your review has been published!', 'success');
    closeModal('reviewModal');
    await renderModalReviews(state.selectedMovie.id);
  } catch (err) {
    showToast('Review submitted locally!', 'success');
    closeModal('reviewModal');
  }
}

// ==================== SEAT SELECTION & REAL-TIME LOCK ====================
function startSeatSelection(showtimeId, theatreName, time, format) {
  closeModal('showtimeModal');

  state.currentBooking = {
    movie: state.selectedMovie,
    theatreName,
    showtimeId,
    time,
    format,
    selectedSeats: [],
    seatTier: 'Gold',
    basePrice: state.selectedMovie.priceStarting || 180,
    subtotal: 0,
    fee: 35,
    total: 0
  };

  document.getElementById('seatMovieTitle').textContent = state.selectedMovie.title;
  document.getElementById('seatVenueInfo').textContent = `${theatreName} • ${time} • ${format}`;

  // Build Seat Matrix with 3 Tiers (Recliner, Gold, Silver)
  renderSeatMatrix(showtimeId);
  updateSeatSummary();

  // Start 10-Minute Real-Time Seat Hold Countdown
  startSeatTimer();

  openModal('seatModal');
}

function renderSeatMatrix(showtimeId) {
  const container = document.getElementById('seatGridContainer');
  const showtime = state.showtimes.find(s => s.id === showtimeId) || {};
  const bookedSeats = showtime.bookedSeats || ['A3', 'A4', 'C5', 'E8'];

  // Seat Rows configuration
  const tiers = [
    { name: 'VIP Recliner (₹360)', code: 'Recliner', price: 360, rows: ['A', 'B'] },
    { name: 'Prime Gold (₹250)', code: 'Gold', price: 250, rows: ['C', 'D', 'E'] },
    { name: 'Classic Silver (₹180)', code: 'Silver', price: 180, rows: ['F', 'G'] }
  ];

  container.innerHTML = tiers.map(tier => `
    <div class="seat-tier-section">
      <div class="tier-title">${tier.name}</div>
      ${tier.rows.map(rowLetter => `
        <div class="seat-row">
          <span class="row-label">${rowLetter}</span>
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(seatNum => {
            const seatId = `${rowLetter}${seatNum}`;
            const isBooked = bookedSeats.includes(seatId);
            return `
              <button 
                class="seat-btn" 
                id="btn-seat-${seatId}" 
                data-seat="${seatId}" 
                data-tier="${tier.code}" 
                data-price="${tier.price}"
                ${isBooked ? 'disabled' : ''}
                onclick="toggleSeatSelection('${seatId}', '${tier.code}', ${tier.price})">
                ${seatNum}
              </button>
            `;
          }).join('')}
          <span class="row-label">${rowLetter}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function toggleSeatSelection(seatId, tier, price) {
  const btn = document.getElementById(`btn-seat-${seatId}`);
  const index = state.currentBooking.selectedSeats.indexOf(seatId);

  if (index > -1) {
    state.currentBooking.selectedSeats.splice(index, 1);
    btn.classList.remove('selected');
  } else {
    // Max 8 seats per booking
    if (state.currentBooking.selectedSeats.length >= 8) {
      showToast('Maximum 8 seats allowed per transaction', 'info');
      return;
    }
    state.currentBooking.selectedSeats.push(seatId);
    state.currentBooking.seatTier = tier;
    state.currentBooking.basePrice = price;
    btn.classList.add('selected');
  }

  updateSeatSummary();
}

function updateSeatSummary() {
  const count = state.currentBooking.selectedSeats.length;
  const seatsLabel = document.getElementById('summarySeats');
  const totalLabel = document.getElementById('summaryTotal');
  const proceedBtn = document.getElementById('proceedPayBtn');

  if (count === 0) {
    seatsLabel.textContent = 'None';
    totalLabel.textContent = '₹0';
    proceedBtn.disabled = true;
    state.currentBooking.subtotal = 0;
    state.currentBooking.total = 0;
    return;
  }

  // Calculate pricing based on tier price
  const subtotal = count * state.currentBooking.basePrice;
  const fee = 35; // Convenience fee & 3D glasses charge
  const total = subtotal + fee;

  state.currentBooking.subtotal = subtotal;
  state.currentBooking.fee = fee;
  state.currentBooking.total = total;

  seatsLabel.textContent = `${state.currentBooking.selectedSeats.join(', ')} (${count} seats)`;
  totalLabel.textContent = `₹${total}`;
  proceedBtn.disabled = false;
}

// 10-Minute Transient Seat Lock Timer
function startSeatTimer() {
  stopSeatTimer();
  state.seatSecondsRemaining = 600; // 10 minutes

  const timerEl = document.getElementById('seatLockTimer');

  state.seatTimer = setInterval(() => {
    state.seatSecondsRemaining--;

    const minutes = Math.floor(state.seatSecondsRemaining / 60);
    const seconds = state.seatSecondsRemaining % 60;
    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (state.seatSecondsRemaining <= 0) {
      stopSeatTimer();
      showToast('Seat lock session expired. Please reselect your seats.', 'error');
      closeModal('seatModal');
    }
  }, 1000);
}

function stopSeatTimer() {
  if (state.seatTimer) {
    clearInterval(state.seatTimer);
    state.seatTimer = null;
  }
}

// Proceed to Checkout
function proceedToPayment() {
  if (state.currentBooking.selectedSeats.length === 0) return;

  closeModal('seatModal');

  // Fill Payment summary
  const summaryBox = document.getElementById('paymentOrderSummary');
  const b = state.currentBooking;

  summaryBox.innerHTML = `
    <div class="bill-line">
      <span>Movie</span>
      <strong>${b.movie.title}</strong>
    </div>
    <div class="bill-line">
      <span>Theatre</span>
      <span>${b.theatreName} (${b.time})</span>
    </div>
    <div class="bill-line">
      <span>Seats (${b.selectedSeats.length})</span>
      <span style="color: var(--accent-gold); font-weight: 700;">${b.selectedSeats.join(', ')}</span>
    </div>
    <div class="bill-line">
      <span>Ticket Subtotal</span>
      <span>₹${b.subtotal}</span>
    </div>
    <div class="bill-line">
      <span>Convenience Fee & GST</span>
      <span>₹${b.fee}</span>
    </div>
    <div class="bill-line total">
      <span>Grand Total</span>
      <span>₹${b.total}</span>
    </div>
  `;

  openModal('paymentModal');
}

// Execute Payment Simulation & Confirm Ticket
async function executePayment() {
  const b = state.currentBooking;
  const payBtn = document.querySelector('#paymentModal .btn-primary');
  payBtn.disabled = true;
  payBtn.textContent = 'Processing Payment...';

  try {
    const bookingPayload = {
      userId: state.user ? state.user.id : 'usr-demo',
      userName: state.user ? state.user.name : 'Aaradhya Sharma',
      userEmail: state.user ? state.user.email : 'aaradhya.sharma@imovies.com',
      movieId: b.movie.id,
      movieTitle: b.movie.title,
      posterUrl: b.movie.posterUrl,
      theatreId: 'th-1',
      theatreName: b.theatreName,
      showtimeId: b.showtimeId,
      showTime: b.time,
      showDate: state.selectedShowDate,
      seats: b.selectedSeats,
      seatTier: b.seatTier,
      subtotal: b.subtotal,
      convenienceFee: b.fee,
      totalAmount: b.total
    };

    const res = await fetch(`${API_BASE}/bookings/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    }).then(r => r.json()).catch(() => null);

    const confirmedBooking = (res && res.booking) ? res.booking : {
      ...bookingPayload,
      bookingId: 'IMV-' + Math.floor(10000 + Math.random() * 90000),
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      bookedAt: new Date().toISOString()
    };

    // Update client ticket list
    state.tickets.unshift(confirmedBooking);
    stopSeatTimer();
    closeModal('paymentModal');

    // Display Digital Boarding Pass Ticket
    renderDigitalTicketPass(confirmedBooking);
    openModal('ticketModal');

    showToast('Payment successful! Cinema ticket confirmed.', 'success');
    updateBadges();

  } catch (err) {
    showToast('Booking finalized!', 'success');
    closeModal('paymentModal');
  } finally {
    payBtn.disabled = false;
    payBtn.textContent = 'Confirm & Pay Now';
  }
}

// ==================== DIGITAL TICKET PASS ====================
function renderDigitalTicketPass(ticket) {
  const container = document.getElementById('ticketPassContent');
  container.innerHTML = `
    <div class="ticket-pass">
      <div class="ticket-top">
        <img class="ticket-poster" src="${ticket.posterUrl}" alt="${ticket.movieTitle}">
        <div class="ticket-main-meta">
          <span class="badge badge-accent" style="margin-bottom: 6px; display: inline-block;">CONFIRMED PASS</span>
          <h3>${ticket.movieTitle}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${ticket.theatreName}</p>
        </div>
      </div>

      <div class="ticket-perforation">
        <div class="perf-line"></div>
      </div>

      <div class="ticket-bottom">
        <div class="ticket-grid-specs">
          <div class="spec-cell">
            <span>DATE</span>
            <strong>${ticket.showDate || 'Today'}</strong>
          </div>
          <div class="spec-cell">
            <span>TIME</span>
            <strong>${ticket.showTime}</strong>
          </div>
          <div class="spec-cell">
            <span>SEATS</span>
            <strong style="color: var(--accent-gold);">${ticket.seats.join(', ')}</strong>
          </div>
          <div class="spec-cell">
            <span>TIER</span>
            <strong>${ticket.seatTier || 'Prime'}</strong>
          </div>
          <div class="spec-cell">
            <span>AMOUNT</span>
            <strong>₹${ticket.totalAmount}</strong>
          </div>
          <div class="spec-cell">
            <span>ORDER REF</span>
            <strong style="font-family: monospace;">${ticket.bookingId}</strong>
          </div>
        </div>

        <div class="barcode-box">
          <svg class="barcode-svg" viewBox="0 0 200 40">
            <rect x="0" y="0" width="4" height="40" fill="#000"></rect>
            <rect x="8" y="0" width="2" height="40" fill="#000"></rect>
            <rect x="14" y="0" width="6" height="40" fill="#000"></rect>
            <rect x="24" y="0" width="2" height="40" fill="#000"></rect>
            <rect x="30" y="0" width="4" height="40" fill="#000"></rect>
            <rect x="40" y="0" width="8" height="40" fill="#000"></rect>
            <rect x="52" y="0" width="2" height="40" fill="#000"></rect>
            <rect x="58" y="0" width="4" height="40" fill="#000"></rect>
            <rect x="68" y="0" width="6" height="40" fill="#000"></rect>
            <rect x="80" y="0" width="2" height="40" fill="#000"></rect>
            <rect x="86" y="0" width="6" height="40" fill="#000"></rect>
            <rect x="98" y="0" width="4" height="40" fill="#000"></rect>
            <rect x="108" y="0" width="2" height="40" fill="#000"></rect>
            <rect x="114" y="0" width="8" height="40" fill="#000"></rect>
            <rect x="128" y="0" width="2" height="40" fill="#000"></rect>
            <rect x="134" y="0" width="4" height="40" fill="#000"></rect>
            <rect x="144" y="0" width="6" height="40" fill="#000"></rect>
            <rect x="156" y="0" width="4" height="40" fill="#000"></rect>
            <rect x="166" y="0" width="2" height="40" fill="#000"></rect>
            <rect x="174" y="0" width="6" height="40" fill="#000"></rect>
            <rect x="186" y="0" width="4" height="40" fill="#000"></rect>
            <rect x="194" y="0" width="4" height="40" fill="#000"></rect>
          </svg>
          <span class="barcode-text">${ticket.bookingId}</span>
        </div>
      </div>
    </div>
  `;
}

// ==================== MY TICKETS TAB ====================
function renderTicketsList() {
  const container = document.getElementById('ticketsList');
  if (!container) return;

  if (state.tickets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
        </svg>
        <h3>No Tickets Booked Yet</h3>
        <p>Explore Hindi blockbusters or Hollywood releases and book your front-row experience.</p>
        <button class="btn btn-primary" onclick="navigateTo('movies')">Browse Movies</button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.tickets.map(ticket => `
    <div class="ticket-item-card">
      <div class="ticket-item-left">
        <img class="ticket-thumb" src="${ticket.posterUrl}" alt="${ticket.movieTitle}">
        <div class="ticket-item-meta">
          <h4>${ticket.movieTitle}</h4>
          <p class="ticket-item-sub">${ticket.theatreName} • ${ticket.showDate || 'Today'}, ${ticket.showTime}</p>
          <div>
            <span class="seats-pill">Seats: ${ticket.seats.join(', ')}</span>
            <span style="font-size: 0.8rem; color: var(--text-dim); margin-left: 8px;">Total: ₹${ticket.totalAmount}</span>
          </div>
        </div>
      </div>
      <div class="ticket-item-actions">
        <span class="ticket-ref">ID: ${ticket.bookingId}</span>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm" onclick='renderDigitalTicketPass(${JSON.stringify(ticket).replace(/'/g, "&apos;")}); openModal("ticketModal");'>
            View Pass
          </button>
          ${ticket.bookingStatus !== 'Cancelled' ? `
            <button class="btn btn-outline btn-sm" style="color: var(--accent-red); border-color: rgba(225, 29, 72, 0.3);" onclick="cancelBooking('${ticket.bookingId}')">
              Cancel
            </button>
          ` : `<span style="color: var(--accent-red); font-size: 0.8rem; font-weight: 600;">Cancelled</span>`}
        </div>
      </div>
    </div>
  `).join('');
}

async function cancelBooking(bookingId) {
  if (!confirm(`Are you sure you want to cancel booking ${bookingId}?`)) return;

  try {
    await fetch(`${API_BASE}/bookings/cancel/${bookingId}`, { method: 'POST' });
    const ticket = state.tickets.find(t => t.bookingId === bookingId);
    if (ticket) ticket.bookingStatus = 'Cancelled';
    showToast(`Booking ${bookingId} cancelled and refund initiated.`, 'info');
    renderTicketsList();
    updateBadges();
  } catch (e) {
    const ticket = state.tickets.find(t => t.bookingId === bookingId);
    if (ticket) ticket.bookingStatus = 'Cancelled';
    renderTicketsList();
    updateBadges();
  }
}

// ==================== WATCHLIST ====================
function toggleWatchlist(movieId, event) {
  if (event) event.stopPropagation();

  const idx = state.watchlist.indexOf(movieId);
  if (idx > -1) {
    state.watchlist.splice(idx, 1);
    showToast('Movie removed from Watchlist', 'info');
  } else {
    state.watchlist.push(movieId);
    showToast('Movie saved to Watchlist!', 'success');
  }

  saveLocalSession();
  updateBadges();
  renderMovieGrid();
  renderHeroBanner();
  renderWatchlist();
}

function renderWatchlist() {
  const grid = document.getElementById('watchlistGrid');
  if (!grid) return;

  const savedMovies = state.movies.filter(m => state.watchlist.includes(m.id));

  if (savedMovies.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h3>Your Watchlist is Empty</h3>
        <p>Save Hindi & Hollywood movies you are excited about for fast 1-click booking.</p>
        <button class="btn btn-outline" onclick="navigateTo('movies')">Browse Movies</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = savedMovies.map(movie => `
    <div class="movie-card">
      <div class="movie-poster-box">
        <img class="movie-poster-img" src="${movie.posterUrl}" alt="${movie.title}">
        <button class="card-save-btn active" onclick="toggleWatchlist('${movie.id}', event)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <p class="movie-genres-text">${movie.genres.join(', ')}</p>
        <div class="movie-footer-row">
          <span class="lang-tag">${movie.language}</span>
          <button class="card-book-btn" onclick="openShowtimeModal('${movie.id}')">Book Tickets</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ==================== ADMIN DASHBOARD ====================
async function renderAdminDashboard() {
  try {
    const statsRes = await fetch(`${API_BASE}/admin/stats`).then(r => r.json()).catch(() => null);

    if (statsRes) {
      document.getElementById('statRevenue').textContent = `₹${statsRes.totalRevenue.toLocaleString()}`;
      document.getElementById('statBookings').textContent = statsRes.totalBookings;
      document.getElementById('statTickets').textContent = statsRes.totalTicketsSold;
      document.getElementById('statMovies').textContent = statsRes.totalMovies;
    } else {
      const activeBookings = state.tickets.filter(t => t.bookingStatus !== 'Cancelled');
      const rev = activeBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      document.getElementById('statRevenue').textContent = `₹${rev.toLocaleString()}`;
      document.getElementById('statBookings').textContent = activeBookings.length;
      document.getElementById('statTickets').textContent = activeBookings.reduce((s, b) => s + (b.seats ? b.seats.length : 2), 0);
      document.getElementById('statMovies').textContent = state.movies.length;
    }

    // Render Movies Table
    const moviesTable = document.getElementById('adminMoviesTableBody');
    moviesTable.innerHTML = state.movies.map(m => `
      <tr>
        <td><strong>${m.title}</strong></td>
        <td><span class="lang-tag">${m.language}</span></td>
        <td>${m.durationMins} mins</td>
        <td>★ ${m.rating}</td>
        <td>₹${m.priceStarting || 180}</td>
        <td>${m.isTrending ? '<span style="color: var(--accent-red); font-weight: 700;">★ Hero</span>' : 'Standard'}</td>
        <td>
          <button class="btn btn-outline btn-sm" style="color: var(--accent-red); border-color: rgba(225, 29, 72, 0.3);" onclick="deleteMovie('${m.id}')">
            Delete
          </button>
        </td>
      </tr>
    `).join('');

    // Render Bookings Table
    const bookingsTable = document.getElementById('adminBookingsTableBody');
    bookingsTable.innerHTML = state.tickets.map(b => `
      <tr>
        <td><code style="color: var(--accent-gold);">${b.bookingId}</code></td>
        <td>${b.userName}</td>
        <td>${b.movieTitle}</td>
        <td>${b.theatreName} (${b.showTime})</td>
        <td>${b.seats.join(', ')}</td>
        <td><strong>₹${b.totalAmount}</strong></td>
        <td>
          <span style="color: ${b.bookingStatus === 'Confirmed' ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight: 700;">
            ${b.bookingStatus || 'Confirmed'}
          </span>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.warn('Admin render error:', err);
  }
}

function openAddMovieModal() {
  openModal('addMovieModal');
}

async function handleAddMovieSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('newTitle').value.trim();
  const language = document.getElementById('newLang').value;
  const genres = document.getElementById('newGenres').value.split(',').map(s => s.trim());
  const certification = document.getElementById('newCert').value;
  const durationMins = parseInt(document.getElementById('newDuration').value) || 150;
  const priceStarting = parseInt(document.getElementById('newPrice').value) || 180;
  const posterUrl = document.getElementById('newPoster').value.trim();
  const trailerUrl = document.getElementById('newTrailer').value.trim() || 'https://www.youtube.com/embed/Way9Dexny3w';
  const synopsis = document.getElementById('newSynopsis').value.trim();
  const director = document.getElementById('newDirector').value.trim() || 'Filmmaker';
  const isTrending = document.getElementById('newTrending').value === 'true';

  const moviePayload = {
    title,
    language,
    genres,
    certification,
    durationMins,
    priceStarting,
    posterUrl,
    trailerUrl,
    synopsis,
    director,
    isTrending,
    rating: 4.8
  };

  try {
    const res = await fetch(`${API_BASE}/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moviePayload)
    }).then(r => r.json()).catch(() => null);

    const newMovie = (res && res.movie) ? res.movie : {
      ...moviePayload,
      id: 'mov-' + Date.now(),
      reviewCount: 0
    };

    state.movies.unshift(newMovie);
    if (isTrending) state.currentHeroMovie = newMovie;

    showToast(`Movie "${title}" added to catalog!`, 'success');
    closeModal('addMovieModal');
    document.getElementById('addMovieForm').reset();
    renderApp();
  } catch (err) {
    showToast('Movie added locally!', 'success');
    closeModal('addMovieModal');
  }
}

async function deleteMovie(movieId) {
  if (!confirm('Are you sure you want to remove this movie from cinema listings?')) return;

  try {
    await fetch(`${API_BASE}/movies/${movieId}`, { method: 'DELETE' });
    state.movies = state.movies.filter(m => m.id !== movieId);
    showToast('Movie listing deleted.', 'info');
    renderApp();
  } catch (err) {
    state.movies = state.movies.filter(m => m.id !== movieId);
    renderApp();
  }
}

// ==================== TRAILER MODAL ====================
function playTrailer(trailerUrl, title) {
  const modal = document.getElementById('trailerModal');
  const frameWrapper = document.getElementById('videoFrameWrapper');
  document.getElementById('trailerModalTitle').textContent = `Trailer: ${title}`;

  let embedUrl = trailerUrl || 'https://www.youtube.com/embed/Way9Dexny3w';
  if (embedUrl.includes('watch?v=')) {
    embedUrl = embedUrl.replace('watch?v=', 'embed/');
  }

  frameWrapper.innerHTML = `
    <iframe 
      src="${embedUrl}?autoplay=1&rel=0" 
      title="${title} Trailer" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen>
    </iframe>
  `;

  openModal('trailerModal');
}

function closeTrailerModal() {
  document.getElementById('videoFrameWrapper').innerHTML = '';
  closeModal('trailerModal');
}

// ==================== AUTH & USER SESSIONS ====================
function updateAuthUI() {
  const authBox = document.getElementById('authBox');
  if (!authBox) return;

  if (state.user) {
    const initials = state.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    authBox.innerHTML = `
      <div class="user-profile-badge" onclick="handleUserLogout()" title="Click to Sign Out">
        <span class="user-avatar">${initials}</span>
        <span style="font-size: 0.85rem; font-weight: 600;">${state.user.name}</span>
        ${state.user.role === 'admin' ? '<span class="badge badge-accent">ADMIN</span>' : ''}
      </div>
    `;
  } else {
    authBox.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">Sign In</button>
    `;
  }
}

function updateBadges() {
  const ticketCount = state.tickets.filter(t => t.bookingStatus !== 'Cancelled').length;
  document.getElementById('ticketsBadge').textContent = ticketCount;
  document.getElementById('watchlistBadge').textContent = state.watchlist.length;
}

function openAuthModal(mode) {
  switchAuthTab(mode);
  openModal('authModal');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('groupName').style.display = isLogin ? 'none' : 'block';
  document.getElementById('authSubmitBtn').textContent = isLogin ? 'Sign In' : 'Create Account';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const isLogin = document.getElementById('tabLogin').classList.contains('active');
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim() || 'Film Enthusiast';

  const endpoint = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
  const payload = isLogin ? { email, password } : { name, email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.error) {
      showToast(res.error, 'error');
      return;
    }

    state.user = res.user;
    saveLocalSession();
    updateAuthUI();
    closeModal('authModal');
    showToast(`Welcome back, ${res.user.name}!`, 'success');
  } catch (err) {
    // Offline simulated login
    state.user = {
      id: 'usr-' + Date.now(),
      name: isLogin ? (email.split('@')[0]) : name,
      email,
      role: email.includes('admin') ? 'admin' : 'user'
    };
    saveLocalSession();
    updateAuthUI();
    closeModal('authModal');
    showToast(`Logged in as ${state.user.name}`, 'success');
  }
}

function demoLogin(role) {
  if (role === 'admin') {
    state.user = {
      id: 'usr-admin',
      name: 'IMovies Exhibitor Admin',
      email: 'admin@imovies.com',
      role: 'admin'
    };
    navigateTo('admin');
  } else {
    state.user = {
      id: 'usr-demo',
      name: 'Aaradhya Sharma',
      email: 'aaradhya.sharma@imovies.com',
      role: 'user'
    };
  }
  saveLocalSession();
  updateAuthUI();
  closeModal('authModal');
  showToast(`Logged in with instant Demo ${role.toUpperCase()} profile`, 'success');
}

function handleUserLogout() {
  if (confirm('Do you want to sign out of IMovies?')) {
    state.user = null;
    localStorage.removeItem('imovies_user');
    updateAuthUI();
    showToast('Signed out successfully.', 'info');
  }
}

// ==================== MODAL HELPERS ====================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
