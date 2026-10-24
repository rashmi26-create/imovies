# 🎬 IMovies - Online Movie Ticket Booking Platform

> A full-stack cinema ticketing web platform built with a high-performance Express.js backend and modern responsive cinema client. Seamlessly handles real-time seat availability, multi-tier seat selection, transient seat locking, digital ticket passes, and exhibitor administration.

---

## 🌟 Key Highlights & Differentiators

Unlike generic ticket booking templates, **IMovies** features:
- **Dual Catalog (Hindi & Hollywood)**: Features current Bollywood blockbusters (*Stree 2*, *Jawan*, *12th Fail*, *Fighter*, *Animal*, *Dunki*) alongside Hollywood IMAX spectacles (*Dune: Part Two*, *Oppenheimer*, *Interstellar*, *Spider-Man: Across the Spider-Verse*, *The Batman*, *Inception*).
- **Elevated Cinema Midnight Aesthetic**: Designed with an obsidian-dark cinema palette, glowing amber/ruby cinema neon accents, glassmorphic cards, and smooth responsive animations.
- **3-Tier Interactive Auditorium Grid**: Distinct seating tiers (VIP Lounge Recliners, Prime Gold, Classic Silver) with real-time seat status (`Available`, `Selected`, `Booked`).
- **10-Minute Transient Seat Lock**: Built-in countdown timer holding selected seats to prevent double-booking during checkout.
- **Authentic Digital Ticket Pass**: Perforated stub boarding-pass layout with generated booking reference (`IMV-XXXXX`) and barcode/QR verification.
- **Exhibitor Admin Console**: Real-time KPI analytics (Revenue, Tickets Sold, Occupancy), movie management CRUD, and transaction audit logs.
- **Zero-Error Resilience**: Auto-detects MongoDB and seamlessly connects to local or Atlas databases; if no database server is running, it gracefully runs on a zero-config persistent local data engine without crashing.

---

## 🚀 Quick Start Guide

### 1. Requirements
- **Node.js**: `v18.x` or higher installed on your system.

### 2. Run the Application
Open PowerShell or your terminal in the project directory:

```powershell
cd C:\Users\rashm\.gemini\antigravity\scratch\imovies
node server.js
```

Then open your browser and navigate to:
👉 **`http://localhost:5000`**

---

## 🗄️ Optional: Connecting MongoDB Atlas or Local MongoDB

If you want to connect to a live MongoDB Atlas cluster, create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/imovies?retryWrites=true&w=majority
```

When you start `node server.js`, it will automatically detect Mongoose and connect to your MongoDB cluster.

---

## 📋 Features & Epics Checklist (6 Epics, 19 Tasks)

| Epic | Feature | Status |
| :--- | :--- | :---: |
| **Epic 1** | User Authentication (Sign In, Sign Up, 1-Click Demo Profiles) | ✅ Complete |
| **Epic 2** | Movie Discovery (Hindi + English Filters, Genre Chips, Search) | ✅ Complete |
| **Epic 3** | Venues & Showtimes (PVR, INOX, Cinepolis with IMAX & Dolby Atmos) | ✅ Complete |
| **Epic 4** | Interactive Seat Matrix & 10-Minute Real-Time Seat Locking | ✅ Complete |
| **Epic 5** | Digital Ticket Pass with QR Barcode, My Tickets & Watchlist | ✅ Complete |
| **Epic 6** | Exhibitor Admin Dashboard (Add Movie, Box Office Revenue Stats) | ✅ Complete |

---

## 🔐 Demo Credentials

You can log in instantly using the 1-click demo buttons in the Sign In modal, or use:

- **Admin Account**:
  - Email: `admin@imovies.com`
  - Password: `admin123`
- **User Account**:
  - Email: `user@imovies.com`
  - Password: `user123`

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health and database connection status |
| `GET` | `/api/movies` | Fetch movies (Supports `?language=Hindi`, `?genre=Action`, `?search=Dune`) |
| `POST` | `/api/movies` | Admin endpoint to publish a new film to catalog |
| `DELETE` | `/api/movies/:id` | Remove a movie from listings |
| `GET` | `/api/theatres` | Fetch partner multiplex venues |
| `GET` | `/api/showtimes` | Fetch daily showtimes by movie and theatre |
| `POST` | `/api/bookings/lock-seats` | Hold seats with a 10-minute timeout |
| `POST` | `/api/bookings/confirm` | Confirm reservation and issue digital ticket |
| `GET` | `/api/bookings/user/:id` | Retrieve user bookings and ticket passes |
| `POST` | `/api/bookings/cancel/:id`| Cancel booking and release seats |
| `GET` | `/api/reviews/movie/:id` | Fetch audience reviews and ratings |
| `POST` | `/api/reviews` | Submit star rating and written review |
| `GET` | `/api/admin/stats` | Real-time box office earnings and ticket stats |
