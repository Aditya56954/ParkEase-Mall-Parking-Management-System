# ParkEase — Mall Parking Management System

Full-stack app: RBAC REST API (Node/Express/MongoDB) + React frontend.

```
parkease/
├── backend/     Express API — see backend/README.md for full API reference
└── frontend/    React (Vite) app — one screen per role
```

## Run both together

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env      # set MONGO_URI, JWT_SECRET, etc.
npm run seed:admin        # bootstraps the first admin account
npm run dev                # http://localhost:5000
```

**2. Frontend** (in a second terminal)
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL defaults to http://localhost:5000/api
npm run dev                # http://localhost:5173
```

Open `http://localhost:5173`. Log in with the seeded admin account (from
`backend/.env`) to create guard accounts, or register as a shopper/mall owner.

## What each role sees

| Role        | Route     | Screen |
|-------------|-----------|--------|
| `user`      | `/park`   | Browse approved malls, auto-book a slot, view the QR ticket, booking history |
| `guard`     | `/gate`   | Paste a scanned QR payload, approve entry or process exit (shows the computed bill) |
| `mallOwner` | `/owner`  | Submit malls for approval, generate slots, assign guards, view per-mall analytics |
| `admin`     | `/admin`  | Approve/reject malls, create guard/admin accounts, platform-wide overview |

## Suggested walkthrough

1. Log in as admin (seeded account) → **Users** tab → create a `mallOwner` and a `guard`.
2. Log out, register/log in as the mall owner → **My malls** → submit a mall.
3. Log back in as admin → **Mall approvals** → approve it.
4. As mall owner → **Slots** tab → generate slots for the approved mall.
5. As mall owner → **Guards** tab → paste the guard's user ID (visible in admin's Users table) to assign them to the mall.
6. Register/log in as a `user` → book a slot → note the QR shown.
7. Log in as the guard → **Gate scanner** → paste the QR payload → Approve entry, then later Process exit to see the bill.
8. As mall owner or admin → **Analytics** / **Platform overview** → see live slot and revenue numbers.

## Notes

- The frontend uses **Tailwind CSS** with a custom theme (`frontend/tailwind.config.js`)
  built around a signage-inspired token system — asphalt/barrier-yellow palette,
  Archivo/Inter/JetBrains Mono type, a ticket-stub QR card, and a barrier-stripe
  divider motif — plus [lucide-react](https://lucide.dev) icons throughout.
  Reusable pieces (`.card`, `.btn`, `.pill`, `.field-input`, etc.) are defined
  once via `@layer components` in `frontend/src/styles/index.css`.
- The guard "scanner" accepts pasted QR text rather than driving a camera —
  wiring up a camera-based QR reader (e.g. a `<video>` + a JS decoding lib) is
  a natural next step if this needs to run on a physical device at a gate.
- Both `npm install` steps need network access; this environment doesn't have
  it, so dependencies aren't pre-installed in the zip — you'll need to run
  `npm install` yourself in each folder.
