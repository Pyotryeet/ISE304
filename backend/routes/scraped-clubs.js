const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/scraped-clubs - List all scraped clubs
router.get('/', (req, res) => {
    try {
        const clubs = db.prepare(`
            SELECT * FROM scraped_clubs 
            ORDER BY name ASC
        `).all();
        res.json({ clubs });
    } catch (error) {
        console.error('Error fetching scraped clubs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/scraped-clubs - Add a new club to scrape
router.post('/', authenticateToken, (req, res) => {
    try {
        if (!req.club.isAdmin) {
            return res.status(403).json({ error: 'Admin permission required' });
        }

        const { name, instagramUrl } = req.body;

        if (!name || !instagramUrl) {
            return res.status(400).json({ error: 'Name and Instagram URL are required' });
        }

        // Check if already exists
        const existing = db.prepare('SELECT * FROM scraped_clubs WHERE instagram_url = ?').get(instagramUrl);
        if (existing) {
            return res.status(409).json({ error: 'Club already exists' });
        }

        const result = db.prepare(`
            INSERT INTO scraped_clubs (name, instagram_url)
            VALUES (?, ?)
        `).run(name, instagramUrl);

        const club = db.prepare('SELECT * FROM scraped_clubs WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            message: 'Club added successfully',
            club
        });
    } catch (error) {
        console.error('Error adding scraped club:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/scraped-clubs/:id - Update a scraped club
router.put('/:id', authenticateToken, (req, res) => {
    try {
        if (!req.club.isAdmin) {
            return res.status(403).json({ error: 'Admin permission required' });
        }

        const { name, instagramUrl, isActive } = req.body;

        const club = db.prepare('SELECT * FROM scraped_clubs WHERE id = ?').get(req.params.id);
        if (!club) {
            return res.status(404).json({ error: 'Club not found' });
        }

        db.prepare(`
            UPDATE scraped_clubs 
            SET name = ?, instagram_url = ?, is_active = ?
            WHERE id = ?
        `).run(
            name || club.name,
            instagramUrl || club.instagram_url,
            isActive !== undefined ? (isActive ? 1 : 0) : club.is_active,
            req.params.id
        );

        const updatedClub = db.prepare('SELECT * FROM scraped_clubs WHERE id = ?').get(req.params.id);

        res.json({
            message: 'Club updated successfully',
            club: updatedClub
        });
    } catch (error) {
        console.error('Error updating scraped club:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/scraped-clubs/:id - Delete a scraped club
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        if (!req.club.isAdmin) {
            return res.status(403).json({ error: 'Admin permission required' });
        }

        const club = db.prepare('SELECT * FROM scraped_clubs WHERE id = ?').get(req.params.id);
        if (!club) {
            return res.status(404).json({ error: 'Club not found' });
        }

        db.prepare('DELETE FROM scraped_clubs WHERE id = ?').run(req.params.id);

        res.json({ message: 'Club deleted successfully' });
    } catch (error) {
        console.error('Error deleting scraped club:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/scraped-clubs/bulk - Add multiple clubs (from scraper)
router.post('/bulk', authenticateToken, (req, res) => {
    try {
        if (!req.club.isAdmin) {
            return res.status(403).json({ error: 'Admin permission required' });
        }

        const { clubs } = req.body;

        if (!clubs || !Array.isArray(clubs)) {
            return res.status(400).json({ error: 'Clubs array is required' });
        }

        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO scraped_clubs (name, instagram_url)
            VALUES (?, ?)
        `);

        let addedCount = 0;
        for (const club of clubs) {
            if (club.name && club.instagramUrl) {
                const result = insertStmt.run(club.name, club.instagramUrl);
                if (result.changes > 0) addedCount++;
            }
        }

        res.status(201).json({
            message: `Added ${addedCount} new clubs`,
            addedCount
        });
    } catch (error) {
        console.error('Error adding clubs in bulk:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
