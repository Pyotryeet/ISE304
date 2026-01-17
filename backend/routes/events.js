const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// GET /api/events - List/search events
router.get('/', optionalAuth, (req, res) => {
    try {
        const { search, category, startDate, endDate, status, clubId, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                e.*,
                c.name as club_name,
                c.instagram_url as club_instagram
            FROM events e
            LEFT JOIN clubs c ON e.club_id = c.id
            WHERE 1=1
        `;
        const params = [];

        // Filter by status (default to published for non-admin users)
        if (req.club && req.club.isAdmin) {
            // Admins can see all statuses
            if (status) {
                query += ' AND e.status = ?';
                params.push(status);
            }
        } else if (req.club) {
            // Club admins can see their own events + published
            query += ' AND (e.status = ? OR e.club_id = ?)';
            params.push('published', req.club.id);
        } else {
            // Public users can only see published events
            query += ' AND e.status = ?';
            params.push('published');
        }

        // Search in title and description
        if (search) {
            query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Filter by category
        if (category) {
            query += ' AND e.category = ?';
            params.push(category);
        }

        // Filter by date range
        if (startDate) {
            query += ' AND e.event_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND e.event_date <= ?';
            params.push(endDate);
        }

        // Filter by club
        if (clubId) {
            query += ' AND e.club_id = ?';
            params.push(clubId);
        }

        // Order by date and add pagination
        query += ' ORDER BY e.event_date ASC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const events = db.prepare(query).all(...params);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total FROM events e WHERE 1=1
        `;
        const countParams = [];

        if (status) {
            countQuery += ' AND e.status = ?';
            countParams.push(status);
        } else if (!req.club || !req.club.isAdmin) {
            countQuery += ' AND e.status = ?';
            countParams.push('published');
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        res.json({
            events,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + events.length < total
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/events/categories - Get all categories
router.get('/categories', (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT DISTINCT category FROM events 
            WHERE category IS NOT NULL AND status = 'published'
            ORDER BY category
        `).all();
        res.json(categories.map(c => c.category));
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/events/:id - Get single event
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const event = db.prepare(`
            SELECT 
                e.*,
                c.name as club_name,
                c.instagram_url as club_instagram
            FROM events e
            LEFT JOIN clubs c ON e.club_id = c.id
            WHERE e.id = ?
        `).get(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if user can view this event
        if (event.status !== 'published') {
            if (!req.club || (req.club.id !== event.club_id && !req.club.isAdmin)) {
                return res.status(404).json({ error: 'Event not found' });
            }
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/events - Create new event
router.post('/', authenticateToken, (req, res) => {
    try {
        const { title, description, eventDate, endDate, location, category, imageUrl } = req.body;

        // Validate required fields
        if (!title || !eventDate) {
            return res.status(400).json({ error: 'Title and event date are required' });
        }

        // Set status based on user role
        const status = req.club.isAdmin ? 'published' : 'pending_review';

        const result = db.prepare(`
            INSERT INTO events (club_id, title, description, event_date, end_date, location, category, image_url, status, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
        `).run(
            req.club.id,
            title,
            description || null,
            eventDate,
            endDate || null,
            location || null,
            category || null,
            imageUrl || null,
            status
        );

        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/events/:id - Update event
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check permission
        if (event.club_id !== req.club.id && !req.club.isAdmin) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const { title, description, eventDate, endDate, location, category, imageUrl, status } = req.body;

        // Only admins can change status
        let newStatus = event.status;
        if (status && req.club.isAdmin) {
            newStatus = status;
        }

        db.prepare(`
            UPDATE events 
            SET title = ?, description = ?, event_date = ?, end_date = ?, 
                location = ?, category = ?, image_url = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            title || event.title,
            description !== undefined ? description : event.description,
            eventDate || event.event_date,
            endDate !== undefined ? endDate : event.end_date,
            location !== undefined ? location : event.location,
            category !== undefined ? category : event.category,
            imageUrl !== undefined ? imageUrl : event.image_url,
            newStatus,
            req.params.id
        );

        const updatedEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

        res.json({
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check permission
        if (event.club_id !== req.club.id && !req.club.isAdmin) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/events/:id/publish - Publish event (admin only)
router.post('/:id/publish', authenticateToken, (req, res) => {
    try {
        if (!req.club.isAdmin) {
            return res.status(403).json({ error: 'Admin permission required' });
        }

        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        db.prepare(`
            UPDATE events SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(req.params.id);

        res.json({ message: 'Event published successfully' });
    } catch (error) {
        console.error('Error publishing event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/events/:id/archive - Archive event (admin only)
router.post('/:id/archive', authenticateToken, (req, res) => {
    try {
        if (!req.club.isAdmin) {
            return res.status(403).json({ error: 'Admin permission required' });
        }

        db.prepare(`
            UPDATE events SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(req.params.id);

        res.json({ message: 'Event archived successfully' });
    } catch (error) {
        console.error('Error archiving event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/events/scraped - Receive scraped events (protected by API Key)
router.post('/scraped', (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];

        // Simple API Key check
        if (!apiKey || apiKey !== (process.env.SCRAPER_API_KEY || 'hive-scraper-secret-key')) {
            return res.status(401).json({ error: 'Invalid API Key' });
        }

        const { title, description, event_date, location, source, instagram_post_url, club_name } = req.body;

        if (!title || !event_date || !club_name) {
            return res.status(400).json({ error: 'Title, event_date, and club_name are required' });
        }

        // Find club by name (fuzzy match or exact)
        let club = db.prepare('SELECT id FROM clubs WHERE name = ? COLLATE NOCASE').get(club_name.trim());

        if (!club) {
            // Auto-create club if it doesn't exist (for scraper integration)
            const newClub = db.prepare(`
                INSERT INTO clubs (name, instagram_url, password_hash, is_admin)
                VALUES (?, ?, 'scraped_account', 0)
            `).run(club_name.trim(), `https://instagram.com/${club_name.trim()}`);

            club = { id: newClub.lastInsertRowid };
            console.log(`Auto-created club '${club_name}' from scraper`);
        }

        // Check for duplicates (same club, title, date)
        const existingEvent = db.prepare(`
            SELECT id FROM events 
            WHERE club_id = ? AND title = ? AND event_date = ?
        `).get(club.id, title, event_date);

        if (existingEvent) {
            return res.status(200).json({ message: 'Event already exists', id: existingEvent.id });
        }

        // Insert new scraped event
        const result = db.prepare(`
            INSERT INTO events (club_id, title, description, event_date, location, source, status, image_url)
            VALUES (?, ?, ?, ?, ?, 'scraped', 'published', ?)
        `).run(
            club.id,
            title,
            description || '',
            event_date,
            location || '',
            instagram_post_url // Using post URL as image/link placeholder for now
        );

        res.status(201).json({
            message: 'Scraped event created',
            id: result.lastInsertRowid
        });

    } catch (error) {
        console.error('Error receiving scraped event:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
