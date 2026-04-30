# WW Room Calendar

An internal room scheduling board designed to be embedded inside GoHighLevel as an iframe. Staff can view room availability at a glance, create holds and bookings, and manage reservations with conflict detection.

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Express + TypeScript + better-sqlite3
- **Calendar:** Custom resource-based grid (no premium calendar library needed — built from scratch for full control over resource scheduling, held/booked styling, and iframe-friendly layout)

## Features

- Weekly and daily resource calendar views
- Rooms as color-coded columns
- Held (faded + dashed border) vs Booked (solid) visual distinction
- Click empty slot to create a reservation
- Click reservation to edit, delete, or confirm booking
- Conflict detection prevents double-booking a room
- Filter by room and status
- Current time indicator
- Responsive, iframe-friendly layout

## Prerequisites

- Node.js 18+
- npm

## Local Setup

```bash
# Install all dependencies (root, server, and client)
npm run install:all

# Seed the database with sample rooms and reservations
npm run seed

# Start both server and client in dev mode
npm run dev
```

- Client runs at `http://localhost:5173`
- Server runs at `http://localhost:3001`
- The Vite dev server proxies `/api` requests to the Express server

## Production Build & Deploy

```bash
# Build the frontend
npm run build

# Start the production server (serves API + static frontend)
npm start
```

The Express server serves the built client from `client/dist/` and handles API routes. Deploy to any Node.js host (Railway, Render, Fly.io, VPS, etc.).

### Environment Variables

- `PORT` — Server port (default: 3001)

### Database

SQLite database is stored at `server/data/rooms.db`. It's created automatically on first run. Back up this file to preserve data.

## Seed Data

Run `npm run seed` to populate the database with:
- 4 rooms: River Room (blue), Summit Room (green), Cedar Room (amber), Blue Ridge Room (purple)
- 10 sample reservations across the current week (mix of held and booked)

## API Endpoints

### Rooms
- `GET /api/rooms` — List all rooms
- `GET /api/rooms/:id` — Get a room
- `POST /api/rooms` — Create a room
- `PUT /api/rooms/:id` — Update a room
- `DELETE /api/rooms/:id` — Delete a room

### Reservations
- `GET /api/reservations?start=&end=&room_id=&status=` — List reservations (filterable)
- `GET /api/reservations/:id` — Get a reservation
- `POST /api/reservations` — Create a reservation (conflict-checked)
- `PUT /api/reservations/:id` — Update a reservation (conflict-checked)
- `DELETE /api/reservations/:id` — Delete a reservation

## How to Embed This in GoHighLevel

### Step 1: Deploy the App
Deploy the app to a publicly accessible URL (e.g., `https://rooms.yourcompany.com`). Ensure HTTPS is enabled.

### Step 2: Add a Custom Menu Link in GoHighLevel
1. Log into your GoHighLevel sub-account
2. Go to **Settings → Custom Menu Links**
3. Click **Add New**
4. Set the **Name** to "Room Calendar" (or whatever you prefer)
5. Set the **URL** to your deployed app URL
6. Choose an icon
7. Set **Open in** to "Iframe" (this embeds it inside the GHL dashboard)
8. Save

### Step 3: Access It
The Room Calendar now appears in your GHL sidebar navigation. Click it to open the scheduling board inline without leaving GHL.

### Tips for Iframe Embedding
- The app uses `height: 100%` on html/body/root to fill the iframe
- No full-screen assumptions — works at any reasonable iframe size
- If you need to restrict access, add auth middleware to the Express server (the app is structured to support this)
- To allow the iframe to work, your server's CORS and `X-Frame-Options` headers may need adjustment depending on your hosting setup

## Auth

Version 1 has no authentication. The app is designed for embedding in an authenticated GHL environment. To add auth later:
1. Add auth middleware to `server/src/index.ts`
2. Protect `/api/*` routes
3. Pass user identity to `created_by` field on reservations

## Project Structure

```
ww-booking-cal/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CalendarGrid.tsx      # Resource-based calendar grid
│   │   │   ├── CalendarToolbar.tsx    # Navigation, filters, view toggle
│   │   │   ├── ReservationBlock.tsx   # Reservation on the grid
│   │   │   ├── ReservationModal.tsx   # Create/edit reservation form
│   │   │   ├── RoomLegend.tsx         # Room color legend
│   │   │   └── StatusBadge.tsx        # Held/Booked badge
│   │   ├── hooks/
│   │   │   └── useCalendarData.ts     # Data fetching hook
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   ├── utils/
│   │   │   ├── api.ts                # API client
│   │   │   └── calendar.ts           # Calendar utilities
│   │   ├── App.tsx                   # Main app component
│   │   ├── index.css                 # Tailwind entry
│   │   └── main.tsx                  # React entry
│   └── index.html
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts           # SQLite setup
│   │   │   └── seed.ts               # Seed data
│   │   ├── routes/
│   │   │   ├── rooms.ts              # Room CRUD
│   │   │   └── reservations.ts       # Reservation CRUD + conflict detection
│   │   └── index.ts                  # Express server
│   └── data/                         # SQLite database (auto-created)
└── README.md
```
