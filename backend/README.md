# ParkEase backend

A role-based access control (RBAC) REST API for mall parking: mall approval
workflows, auto slot allocation, QR-based entry/exit verification, and
duration-based billing. Built with Node.js, Express, and MongoDB (Mongoose).

> This is the `backend/` half of the project. See `../frontend` for the React
> UI, and the root `README.md` for how to run both together.

## Features

- **RBAC** across four roles: `user`, `mallOwner`, `guard`, `admin`
- **Mall approval workflow**: mall owners submit malls, admins approve/reject
- **Atomic slot allocation** via `findOneAndUpdate` — no double-booking under
  concurrent requests
- **One-active-booking-per-user constraint**, enforced at the database level
  with a MongoDB partial unique index (not just an app-side check)
- **QR-based entry/exit**: server-side state validation ensures exit is only
  processed for bookings that actually entered, and entry only for bookings
  that haven't already entered
- **Duration-based billing**, calculated at exit
- **Dashboard analytics** using `Promise.all` to run slot-count and revenue
  aggregations concurrently instead of sequentially

## Project structure

```
parkease/
├── config/db.js               MongoDB connection
├── models/                    User, Mall, Slot, Booking (Mongoose schemas)
├── middleware/                auth (JWT), role (RBAC), errorHandler
├── controllers/                auth, mall, slot, booking, dashboard, admin
├── routes/                     one router per resource
├── utils/                      billing calc, QR generation, JWT signing, admin seed
└── server.js                   app entry point
```

## Setup

```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET, MONGO_URI, etc.

# Make sure MongoDB is running locally (or point MONGO_URI at Atlas)

npm run seed:admin        # creates the first admin account (from .env)
npm run dev                # starts on http://localhost:5000
```

## Roles & how accounts are created

| Role        | How the account is created                                   |
|-------------|----------------------------------------------------------------|
| `user`      | Self-registers via `POST /api/auth/register`                  |
| `mallOwner` | Self-registers via `POST /api/auth/register` with `role: "mallOwner"` |
| `guard`     | Created by an `admin` via `POST /api/admin/users`, then assigned to a mall |
| `admin`     | Bootstrapped via `npm run seed:admin`, or created by an existing admin |

This split is deliberate: privileged roles (`guard`, `admin`) can't be
self-assigned through public registration.

## Core workflow

1. **Mall owner** registers → creates a mall (`POST /api/malls`, status `pending`)
2. **Admin** approves it (`PATCH /api/malls/:id/approve`)
3. **Mall owner** generates slots (`POST /api/malls/:mallId/slots/generate`)
4. **Admin** creates guard accounts, mall owner/admin assigns them to the mall
   (`PATCH /api/malls/:id/assign-guard`)
5. **User** books a slot (`POST /api/bookings`) → gets a QR code back
6. **Guard** scans the QR at entry (`POST /api/bookings/entry`) and exit
   (`POST /api/bookings/exit`) — exit response includes the computed bill
7. **Mall owner/admin** views live analytics (`GET /api/dashboard/:mallId`)

## API reference

### Auth — `/api/auth`
| Method | Route      | Access | Notes |
|--------|-----------|--------|-------|
| POST   | `/register` | Public | `role` may only be `user` or `mallOwner` |
| POST   | `/login`    | Public | Returns JWT |
| GET    | `/me`       | Any authenticated user | |

### Malls — `/api/malls`
| Method | Route                       | Access               |
|--------|-----------------------------|-----------------------|
| POST   | `/`                          | mallOwner             |
| GET    | `/my`                        | mallOwner              |
| GET    | `/`                          | Any (non-admins see only approved malls) |
| GET    | `/:id`                       | Any                    |
| PATCH  | `/:id/approve`               | admin                  |
| PATCH  | `/:id/reject`                | admin                  |
| PATCH  | `/:id/assign-guard`          | mallOwner (own mall), admin |
| POST   | `/:mallId/slots/generate`    | mallOwner (own mall), admin |
| GET    | `/:mallId/slots`             | Any                    |

### Bookings — `/api/bookings`
| Method | Route          | Access | Notes |
|--------|----------------|--------|-------|
| POST   | `/`            | user   | Auto-allocates a slot, returns booking + QR data URL |
| GET    | `/my`          | user   | |
| PATCH  | `/:id/cancel`  | user   | Only while status is `booked` (pre-entry) |
| POST   | `/entry`       | guard, admin | Body: `{ qrToken }` |
| POST   | `/exit`        | guard, admin | Body: `{ qrToken }` — returns computed bill |

### Dashboard — `/api/dashboard`
| Method | Route                | Access |
|--------|-----------------------|--------|
| GET    | `/:mallId`             | mallOwner (own mall), admin |
| GET    | `/admin/overview`      | admin |

### Admin — `/api/admin`
| Method | Route                     | Access |
|--------|---------------------------|--------|
| POST   | `/users`                   | admin — create guard/admin/mallOwner/user accounts |
| GET    | `/users`                   | admin |
| PATCH  | `/users/:id/deactivate`    | admin |

All protected routes expect `Authorization: Bearer <token>`.

## Design notes

- **Double-booking prevention**: slot allocation is a single atomic
  `findOneAndUpdate({mall, status:'available'}, {$set:{status:'booked'}})` —
  MongoDB guarantees only one concurrent request can win that update.
- **One active booking per user**: enforced by a partial unique index on
  `Booking` (`{ user: 1 }`, unique, filtered to `status in [booked, active]`).
  If a `Booking.create` fails because of it, the slot claimed just before is
  released back to `available` as a compensating action.
- **QR tokens**: a random UUID per booking (not the Mongo `_id`), so a booking
  can't be guessed/enumerated from a scanned code.
- **Billing**: rounds up to the nearest hour with a configurable minimum
  charge floor (`MIN_CHARGE_MINUTES` in `.env`) to prevent near-zero "quick
  exit" abuse.
- **Dashboard performance**: slot-count and revenue aggregations read
  different collections and don't depend on each other, so they run inside a
  single `Promise.all` rather than back-to-back awaits.

## Assumptions made while building this

Since the spec didn't cover every implementation detail, a few reasonable
choices were made and can easily be changed:
- Billing rate is a flat rate per mall (`RATE_PER_HOUR` in `.env`), not
  per-mall-configurable in the DB — trivial to move onto the `Mall` model if
  needed.
- Guards are assigned to exactly one mall at a time via `assignedMall`.
- Transactions (Mongo sessions) weren't used for slot allocation, since that
  requires a replica-set MongoDB deployment; instead, atomic single-document
  ops + a compensating rollback keep it correct on a standalone MongoDB too.
