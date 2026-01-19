# System Testing Guide

This document defines the comprehensive testing strategy for "The Hive" system, including the Backend API, Frontend Application, and Instagram Scraper.

## 1. Automated Testing

### Backend API
The backend uses **Jest** and **Supertest** for unit and integration testing.

**Location:** `backend/`
**Command:**
```bash
cd backend
npm test
```

**Test Suites:**
- `auth.test.js`: Verifies club registration and login.
- `events.test.js`: Verifies event CRUD operations.
- `reminders.test.js`: Verifies reminder functionality.
- `scraper.test.js`: Verifies the scraper integration endpoint (`/api/events/scraped`).
- `integration.test.js`: End-to-end API workflow tests using the real database.

### Frontend Application
The frontend uses **Vitest** for component testing.

**Location:** `frontend/`
**Command:**
```bash
cd frontend
npm test
```

**Scope:**
- Verifies rendering of key components (`EventCard`, `SearchBar`, etc.).
- Checks user interactions (filtering, searching).

---

## 2. Integrated System Testing (End-to-End)

To verify the entire system is working together, follow these steps:

### Step 1: Start the Backend Server
Open a terminal and run:
```bash
cd backend
npm start
```
*Server will start on http://localhost:3001*

### Step 2: Seed Scraper Data (Simulation)
Instead of waiting for the actual scraper to crawl Instagram (which is slow), use the seed script to simulate the scraper sending data to the backend.

Open a NEW terminal:
```bash
cd instagram_scraper_v2
source venv/bin/activate  # or venv\Scripts\activate on Windows
python seed_scraped_data.py
```
*You should see "✓ Synced" messages for multiple events.*

### Step 3: Verify Data via API
Check if the events were created:
```bash
curl "http://localhost:3001/api/events?limit=5"
```
*You should see the seeding events (e.g., "MDK Konseri", "Film Gösterimi") in the JSON response.*

### Step 4: Verify Frontend Display
1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open your browser to `http://localhost:5173`.
3. You should see the cards for the events you just seeded. Events with source "scraped" should appear with the scraped badge/styling.

---

## 3. Maintenance

- **If you change DB Schema**: Update `backend/database/schema.sql` and run `npm run test:integration` to ensure no breakages.
- **If you change Scraper Logic**: Ensure `backend_client.py` payload matches what `backend/routes/events.js` expects.
