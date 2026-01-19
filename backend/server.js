const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Wait for database before starting routes
db.ready.then(() => {
    // API Routes
    const authRoutes = require('./routes/auth');
    const eventsRoutes = require('./routes/events');
    const remindersRoutes = require('./routes/reminders');
    const scrapedClubsRoutes = require('./routes/scraped-clubs');
    const clubsRoutes = require('./routes/clubs');

    app.use('/api/auth', authRoutes);
    app.use('/api/events', eventsRoutes);
    app.use('/api/reminders', remindersRoutes);
    app.use('/api/scraped-clubs', scrapedClubsRoutes);
    app.use('/api/clubs', clubsRoutes);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'The Hive API'
        });
    });

    // API documentation endpoint
    app.get('/api', (req, res) => {
        res.json({
            name: 'The Hive API',
            version: '1.0.0',
            description: 'ITU Campus Event Aggregation Platform',
            endpoints: {
                auth: {
                    'POST /api/auth/register': 'Register a new club',
                    'POST /api/auth/login': 'Club admin login',
                    'GET /api/auth/me': 'Get current user info'
                },
                events: {
                    'GET /api/events': 'List/search events',
                    'GET /api/events/:id': 'Get single event',
                    'POST /api/events': 'Create new event (auth required)',
                    'PUT /api/events/:id': 'Update event (auth required)',
                    'DELETE /api/events/:id': 'Delete event (auth required)',
                    'POST /api/events/:id/publish': 'Publish event (admin only)',
                    'POST /api/events/:id/archive': 'Archive event (admin only)'
                },
                reminders: {
                    'POST /api/reminders': 'Set a reminder',
                    'GET /api/reminders': 'Get reminders for a student',
                    'DELETE /api/reminders/:id': 'Remove a reminder',
                    'GET /api/reminders/check': 'Check if reminder exists'
                },
                scrapedClubs: {
                    'GET /api/scraped-clubs': 'List all scraped clubs',
                    'POST /api/scraped-clubs': 'Add a club to scrape (admin only)',
                    'PUT /api/scraped-clubs/:id': 'Update a scraped club (admin only)',
                    'DELETE /api/scraped-clubs/:id': 'Delete a scraped club (admin only)'
                }
            }
        });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Endpoint not found' });
    });

    // Start server only if run directly
    if (require.main === module) {
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════╗
║                    THE HIVE API                        ║
║        ITU Campus Event Aggregation Platform           ║
╠════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}              ║
║  API docs at: http://localhost:${PORT}/api                ║
╚════════════════════════════════════════════════════════╝
            `);
        });
    }
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

module.exports = app;
