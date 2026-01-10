# The Hive 🐝

**ITU Campus Event Aggregation Platform**

A centralized web application for ITU students to discover all campus events in one place. The platform aggregates events from manual club entries and automated Instagram scraping.

## Project Structure

```
ISE304/
├── backend/           # Node.js/Express API server
│   ├── database/      # SQLite database and schema
│   ├── routes/        # API endpoints
│   ├── middleware/    # Authentication middleware
│   └── server.js      # Main server file
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── context/       # React context providers
│       └── hooks/         # Custom React hooks
├── scraper/           # Python Playwright scrapers
│   ├── club_scraper.py        # Scrapes club list from ari24.com
│   └── instagram_scraper.py   # Scrapes events from Instagram
└── documents/         # Project specifications
```

## Quick Start

### Prerequisites
- Node.js 18+ (for backend and frontend)
- Python 3.10+ (for scraper)
- npm

### 1. Start the Backend

```bash
cd backend
npm install
node database/seed.js  # Seed sample data (optional)
npm start
```

The API will be available at `http://localhost:3001`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Run the Scrapers (Optional)

```bash
cd scraper
pip install -r requirements.txt
playwright install chromium

# Scrape club list from ari24.com
python club_scraper.py

# Scrape Instagram events
python instagram_scraper.py
```

## Features

### For Students
- 🔍 **Event Discovery**: Browse and search all campus events
- 🏷️ **Filter by Category**: Music, Sports, Technology, Art, etc.
- 📅 **Date Filtering**: Find events within specific date ranges
- 🔔 **Reminders**: Set email reminders for events

### For Club Admins
- ✏️ **Event Creation**: Post new events with rich details
- 📝 **Event Management**: Edit, publish, or archive events
- 📊 **Dashboard**: View and manage all club events

### For System Admins
- 🤖 **Automated Scraping**: Instagram posts converted to draft events
- ✅ **Event Approval**: Review and publish scraped events
- 🏛️ **Club Management**: Manage registered clubs

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new club
- `POST /api/auth/login` - Club admin login
- `GET /api/auth/me` - Get current user info

### Events
- `GET /api/events` - List/search events (with filters)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (auth required)
- `PUT /api/events/:id` - Update event (auth required)
- `DELETE /api/events/:id` - Delete event (auth required)

### Reminders
- `POST /api/reminders` - Set a reminder
- `GET /api/reminders` - Get student's reminders
- `DELETE /api/reminders/:id` - Remove a reminder

## Test Accounts

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@itu.edu.tr | admin123 |
| Club | music@itu.edu.tr | club123 |

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (sql.js)
- **Auth**: JWT + bcrypt

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: Custom CSS (no dependencies)

### Scraper
- **Language**: Python 3
- **Browser Automation**: Playwright
- **Mode**: headless=False (visible browser)

## Team - Fantastic 4

- **Andaç Bilgili** - Team Lead/UX
- **Gülşah Öykü Kırlı** - DevOps & Testing
- **Mustafa Efe Arslan** - Frontend Developer
- **Yiğit Aydoğan** - Backend Developer

## License

ISE 304 - Software Engineering Course Project @ ITU
