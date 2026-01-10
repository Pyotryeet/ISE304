const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database/db');
const { generateToken, authenticateToken } = require('../middleware/auth');

// POST /api/auth/register - Register a new club
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, instagramUrl } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Check if email already exists
        const existingClub = db.prepare('SELECT id FROM clubs WHERE email = ?').get(email);
        if (existingClub) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new club
        const result = db.prepare(`
            INSERT INTO clubs (name, email, password_hash, instagram_url)
            VALUES (?, ?, ?, ?)
        `).run(name, email, passwordHash, instagramUrl || null);

        const club = db.prepare('SELECT id, name, email, instagram_url, is_admin FROM clubs WHERE id = ?').get(result.lastInsertRowid);

        // Generate token
        const token = generateToken(club);

        res.status(201).json({
            message: 'Club registered successfully',
            club: {
                id: club.id,
                name: club.name,
                email: club.email,
                instagramUrl: club.instagram_url
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login - Club admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find club by email
        const club = db.prepare('SELECT * FROM clubs WHERE email = ?').get(email);
        if (!club) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, club.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(club);

        res.json({
            message: 'Login successful',
            club: {
                id: club.id,
                name: club.name,
                email: club.email,
                instagramUrl: club.instagram_url,
                isAdmin: club.is_admin === 1
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
    const club = db.prepare('SELECT id, name, email, instagram_url, is_admin FROM clubs WHERE id = ?').get(req.club.id);
    if (!club) {
        return res.status(404).json({ error: 'Club not found' });
    }
    res.json({
        id: club.id,
        name: club.name,
        email: club.email,
        instagramUrl: club.instagram_url,
        isAdmin: club.is_admin === 1
    });
});

module.exports = router;
