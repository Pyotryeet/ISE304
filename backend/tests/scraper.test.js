/**
 * THE HIVE - Scraper API Integration Tests
 * Tests for /api/events/scraped endpoint
 */

const request = require('supertest');
const express = require('express');
const eventsRoutes = require('../routes/events');

// Mock database
jest.mock('../database/db', () => {
    const mockClubs = [
        { id: 1, name: 'Test Club' }
    ];

    const mockEvents = [];

    return {
        prepare: jest.fn((sql) => ({
            get: jest.fn((...params) => {
                // Find club by name
                if (sql.includes('FROM clubs WHERE name = ?')) {
                    if (params[0] === 'Test Club') return mockClubs[0];
                    return null;
                }

                // Check duplicate
                if (sql.includes('SELECT id FROM events') && sql.includes('club_id = ?')) {
                    return mockEvents.find(e =>
                        e.club_id === params[0] &&
                        e.title === params[1] &&
                        e.event_date === params[2]
                    );
                }
                return undefined;
            }),
            run: jest.fn((...params) => {
                // Insert event
                if (sql.includes('INSERT INTO events')) {
                    const newEvent = {
                        id: mockEvents.length + 1,
                        club_id: params[0],
                        title: params[1],
                        event_date: params[3]
                    };
                    mockEvents.push(newEvent);
                    return { lastInsertRowid: newEvent.id };
                }
                return { lastInsertRowid: 0 };
            })
        }))
    };
});

const app = express();
app.use(express.json());
app.use('/api/events', eventsRoutes);

describe('Scraper API Integration Tests', () => {
    const API_KEY = process.env.SCRAPER_API_KEY || 'hive-scraper-secret-key';

    test('Should reject request without API key', async () => {
        await request(app)
            .post('/api/events/scraped')
            .send({})
            .expect(401);
    });

    test('Should reject request with invalid API key', async () => {
        await request(app)
            .post('/api/events/scraped')
            .set('x-api-key', 'wrong-key')
            .send({})
            .expect(401);
    });

    test('Should create new event successfully', async () => {
        const eventData = {
            title: 'New Scraped Event',
            event_date: '2025-10-10',
            club_name: 'Test Club',
            description: 'Test Description',
            location: 'Test Location',
            instagram_post_url: 'http://instagram.com/p/123'
        };

        const response = await request(app)
            .post('/api/events/scraped')
            .set('x-api-key', API_KEY)
            .send(eventData)
            .expect(201);

        expect(response.body).toHaveProperty('message', 'Scraped event created');
        expect(response.body).toHaveProperty('id');
    });

    test('Should skip duplicate event', async () => {
        // First create
        const eventData = {
            title: 'Duplicate Event',
            event_date: '2025-11-11',
            club_name: 'Test Club'
        };

        await request(app)
            .post('/api/events/scraped')
            .set('x-api-key', API_KEY)
            .send(eventData)
            .expect(201);

        // Try duplicate
        const response = await request(app)
            .post('/api/events/scraped')
            .set('x-api-key', API_KEY)
            .send(eventData)
            .expect(200);

        expect(response.body).toHaveProperty('message', 'Event already exists');
    });

    test('Should auto-create club if unknown', async () => {
        const eventData = {
            title: 'Event',
            event_date: '2025-10-10',
            club_name: 'Non Existent Club'
        };

        await request(app)
            .post('/api/events/scraped')
            .set('x-api-key', API_KEY)
            .send(eventData)
            .send(eventData)
            .expect(201); // Should auto-create club

        // Clean up or check side effects if needed (optional)
        // For now just ensuring it doesn't 404 is enough to match updated logic
    });
});
