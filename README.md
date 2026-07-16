# ParkEase 🅿️

**ParkEase** is a role-based mall parking management system with atomic slot allocation, QR-based entry/exit verification, and duration billing. It provides a production-style REST API plus a full multi-role React dashboard for shoppers, gate guards, mall owners, and platform admins.

> **Status:** Backend and frontend both complete and runnable locally. Not yet deployed to a cloud host.

---

# Features

- 🔐 Role-based access control — User, Mall Owner, Guard, Admin
- 🏬 Mall approval workflow (owner submits → admin approves/rejects)
- 🎟️ Atomic slot auto-allocation (race-condition safe under concurrent bookings)
- 🚫 One-active-booking-per-user, enforced at the database level
- 📷 QR-based entry/exit with server-side booking state validation
- 💰 Duration-based billing, calculated at exit
- 📊 Parallelized dashboard analytics (slot counts + revenue via `Promise.all`)
- 🧑‍✈️ Guard-to-mall assignment
- 🖥️ Full React frontend — one tailored dashboard per role

---

# Tech Stack

## Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcrypt
- QRCode generation

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- lucide-react

---

# Architecture

```text
                 React Frontend (Vite)
                          │
                          ▼
              Express REST API (Node.js)
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   Auth / RBAC      MongoDB (Mongoose)   QR Generation
   (JWT)            Users · Malls ·      (qrcode)
                     Slots · Bookings
```

---

# Project Structure

```text
parkease/
│
├── backend/
│   ├── config/          # MongoDB connection
│   ├── models/          # User, Mall, Slot, Booking
│   ├── middleware/       # auth (JWT), role (RBAC), error handling
│   ├── controllers/      # auth, mall, slot, booking, dashboard, admin
│   ├── routes/
│   ├── utils/            # billing calc, QR generation, JWT signing
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── pages/         # UserDashboard, GuardDashboard, MallOwnerDashboard, AdminDashboard
    │   ├── components/
    │   ├── context/       # AuthContext
    │   └── styles/        # Tailwind entry + design tokens
    └── tailwind.config.js
```

---

# Engineering Highlights

- **Atomic slot allocation** — `findOneAndUpdate({mall, status:'available'}, {$set:{status:'booked'}})` is a single atomic MongoDB operation, so two concurrent booking requests can never be handed the same slot.
- **One-active-booking-per-user** — enforced with a MongoDB **partial unique index** on `Booking` (not just an app-level check), so the constraint holds even under a race between two requests from the same user.
- **Compensating rollback** — if a booking insert fails after a slot was already claimed, the slot is released back to `available` as a compensating action (no distributed transaction needed on a standalone MongoDB).
- **Server-side QR state machine** — entry only succeeds if a booking is `booked`; exit only succeeds if it's `active`. QR tokens are random UUIDs, not database IDs, so bookings can't be enumerated or guessed.
- **Parallelized analytics** — slot-count and revenue aggregations read independent collections, so they run concurrently via `Promise.all` instead of paying their latency sequentially.

---

# Engineering Challenges Solved

- Designed a database-enforced concurrency constraint (partial unique index) instead of relying on application-level locking.
- Built a QR-driven state machine where entry/exit are only valid for specific booking states, preventing replay or out-of-order scans.
- Structured a 4-role RBAC system where privileged roles (guard, admin) can only be created by an existing admin — not self-registered.
- Kept slot allocation correct on a standalone MongoDB (no replica set) by combining atomic single-document ops with compensating rollbacks instead of multi-document transactions.

---

# Roadmap

### ✅ Done

- RBAC backend (User / Mall Owner / Guard / Admin)
- Mall approval workflow
- Atomic slot allocation & booking constraints
- QR entry/exit verification
- Duration-based billing
- Dashboard analytics API
- React frontend for all 4 roles (Tailwind CSS)

### 🔮 Future Enhancements

- Camera-based QR scanning at the gate (currently paste-to-scan)
- Cloud deployment (Railway/Render) + CI pipeline
- Payment gateway integration
- Automated tests
- Docker + docker-compose
- Email/SMS booking notifications

---

# Getting Started

```bash
git clone <repository-url>
cd ParkEase-Mall-Parking-Management-System

# Backend
cd backend
npm install
cp .env.example .env      # set MONGO_URI, JWT_SECRET, etc.
npm run seed:admin         # bootstraps the first admin account
npm run dev                 # http://localhost:5000

# Frontend (in a second terminal)
cd ../frontend
npm install
cp .env.example .env       # VITE_API_URL defaults to http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

---

# Author

**Aditya Pandey**
If you found this project interesting or have suggestions for improvement, feel free to open an issue or connect with me on LinkedIn.
