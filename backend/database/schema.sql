-- The Hive Database Schema
-- Campus Event Aggregation Platform for ITU

-- Clubs table - stores club/organization information
CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    instagram_url TEXT,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table - stores all campus events
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER REFERENCES clubs(id),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    end_date DATETIME,
    location TEXT,
    category TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending_review', 'published', 'archived')),
    source TEXT DEFAULT 'manual' CHECK(source IN ('manual', 'scraped')),
    instagram_post_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students table - for reminder functionality
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reminders table - M:N relationship between students and events
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    remind_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, event_id)
);

-- Scraped clubs table - stores Instagram URLs to scrape
CREATE TABLE IF NOT EXISTS scraped_clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    instagram_url TEXT UNIQUE NOT NULL,
    last_scraped DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_club ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_reminders_student ON reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);
