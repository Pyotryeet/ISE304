const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/clubs - List all clubs
router.get('/', (req, res) => {
    try {
        const clubs = db.prepare(`
            SELECT id, name, instagram_url, is_admin 
            FROM clubs 
            ORDER BY name ASC
        `).all();

        res.json(clubs);
    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
