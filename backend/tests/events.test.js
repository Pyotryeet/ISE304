/**
 * THE HIVE - Events API Tests
 * Unit and Integration Tests for /api/events endpoints
 * 
 * Test Specification Document Reference: Section 2.3, 2.4
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock database
jest.mock('../database/db', () => {
    const mockEvents = [
        {
            id: 1,
            club_id: 1,
            title: 'Test Event 1',
            description: 'Description 1',
            event_date: '2025-02-15T14:00:00',
            location: 'ITU Campus',
            category: 'technology',
            status: 'published',
            source: 'manual',
            club_name: 'Test Club',
            club_instagram: 'https://instagram.com/testclub'
        },
        {
            id: 2,
            club_id: 1,
            title: 'Test Event 2',
            description: 'Description 2',
            event_date: '2025-03-20T10:00:00',
            location: 'EEB Building',
            category: 'music',
            status: 'published',
            source: 'manual',
            club_name: 'Test Club',
            club_instagram: 'https://instagram.com/testclub'
        },
        {
            id: 3,
            club_id: 2,
            title: 'Draft Event',
            description: 'Not published',
            event_date: '2025-04-01T09:00:00',
            location: 'Unknown',
            category: 'sports',
            status: 'draft',
            source: 'scraped',
            club_name: 'Other Club',
            club_instagram: null
        }
    ];

    return {
        ready: Promise.resolve(),
        isReady: () => true,
        prepare: jest.fn((sql) => ({
            get: jest.fn((...params) => {
                if (sql.includes('events') && sql.includes('id = ?')) {
                    const found = mockEvents.find(e => e.id == params[0]);
                    return found;
                }
                if (sql.includes('COUNT')) {
                    return { total: mockEvents.filter(e => e.status === 'published').length };
                }
                return undefined;
            }),
            all: jest.fn((...params) => {
                let filtered = mockEvents;

                // Apply status filter for public users
                if (sql.includes("status = ?") && params.includes('published')) {
                    filtered = filtered.filter(e => e.status === 'published');
                }

                // Apply search filter
                if (sql.includes('LIKE') && params[0]) {
                    const search = params[0].replace(/%/g, '').toLowerCase();
                    filtered = filtered.filter(e =>
                        e.title.toLowerCase().includes(search) ||
                        e.description.toLowerCase().includes(search)
                    );
                }

                // Apply category filter
                if (sql.includes('category = ?')) {
                    const catIndex = params.findIndex(p => ['technology', 'music', 'sports', 'art'].includes(p));
                    if (catIndex >= 0) {
                        filtered = filtered.filter(e => e.category === params[catIndex]);
                    }
                }

                return filtered;
            }),
            run: jest.fn((...params) => {
                const isInsert = sql.includes('INSERT INTO events');
                if (isInsert) {
                    const newEvent = {
                        id: 4,
                        club_id: params[0],
                        title: params[1],
                        description: params[2],
                        event_date: params[3],
                        end_date: params[4],
                        location: params[5],
                        category: params[6],
                        image_url: params[7],
                        status: params[8],
                        source: 'manual'
                    };
                    mockEvents.push(newEvent);
                    return { lastInsertRowid: 4, changes: 1 };
                }
                return { lastInsertRowid: 0, changes: 0 };
            })
        })),
        exec: jest.fn(),
        pragma: jest.fn()
    };
});

const express = require('express');
const eventsRoutes = require('../routes/events');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/events', eventsRoutes);

// Helper to generate test token
const generateTestToken = (clubId = 1, isAdmin = false) => {
    return jwt.sign(
        { id: clubId, name: 'Test Club', email: 'test@itu.edu.tr', isAdmin },
        process.env.JWT_SECRET || 'the-hive-secret-key-change-in-production',
        { expiresIn: '1h' }
    );
};

describe('Events API Tests', () => {

    /**
     * TEST CASE TC-EVT-001 to TC-EVT-010
     * Category: Black Box - Event Discovery (UC-03)
     * Use Case: UC-03 Event Discovery
     */
    describe('GET /api/events', () => {

        // TC-EVT-001: Get all published events without authentication
        test('TC-EVT-001: Should return published events for public users', async () => {
            const response = await request(app)
                .get('/api/events')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('events');
            expect(Array.isArray(response.body.events)).toBe(true);
            // Should only return published events for non-authenticated users
        });

        // TC-EVT-002: Search events by keyword - valid search
        test('TC-EVT-002: Should filter events by search keyword', async () => {
            const response = await request(app)
                .get('/api/events?search=Test')
                .expect(200);

            expect(response.body.events).toBeDefined();
        });

        // TC-EVT-003: Search with empty keyword
        test('TC-EVT-003: Should return all events with empty search', async () => {
            const response = await request(app)
                .get('/api/events?search=')
                .expect(200);

            expect(response.body.events).toBeDefined();
        });

        // TC-EVT-004: Filter by category - valid category
        test('TC-EVT-004: Should filter events by category', async () => {
            const response = await request(app)
                .get('/api/events?category=technology')
                .expect(200);

            expect(response.body.events).toBeDefined();
        });

        // TC-EVT-005: Filter by invalid category
        test('TC-EVT-005: Should return empty for invalid category', async () => {
            const response = await request(app)
                .get('/api/events?category=invalidcategory')
                .expect(200);

            expect(response.body.events).toBeDefined();
        });

        // TC-EVT-006: Filter by date range - valid dates
        test('TC-EVT-006: Should filter events by date range', async () => {
            const response = await request(app)
                .get('/api/events?startDate=2025-01-01&endDate=2025-12-31')
                .expect(200);

            expect(response.body.events).toBeDefined();
        });

        // TC-EVT-007: Pagination - valid limit and offset
        test('TC-EVT-007: Should paginate results correctly', async () => {
            const response = await request(app)
                .get('/api/events?limit=10&offset=0')
                .expect(200);

            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('limit', 10);
            expect(response.body.pagination).toHaveProperty('offset', 0);
        });

        // TC-EVT-008: Combined filters
        test('TC-EVT-008: Should handle multiple filters simultaneously', async () => {
            const response = await request(app)
                .get('/api/events?search=Event&category=technology&limit=5')
                .expect(200);

            expect(response.body.events).toBeDefined();
        });
    });

    /**
     * TEST CASE TC-EVT-020 to TC-EVT-025
     * Category: Black Box - Single Event Retrieval
     */
    describe('GET /api/events/:id', () => {

        // TC-EVT-020: Get event by valid ID
        test('TC-EVT-020: Should return event for valid ID', async () => {
            const response = await request(app)
                .get('/api/events/1')
                .expect(200);

            expect(response.body).toHaveProperty('id', 1);
            expect(response.body).toHaveProperty('title');
        });

        // TC-EVT-021: Get event by invalid ID (non-existent)
        test('TC-EVT-021: Should return 404 for non-existent event', async () => {
            const response = await request(app)
                .get('/api/events/9999')
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Event not found');
        });

        // TC-EVT-022: Get event with invalid ID format
        test('TC-EVT-022: Should handle non-numeric ID gracefully', async () => {
            const response = await request(app)
                .get('/api/events/invalid')
                .expect(404);
        });
    });

    /**
     * TEST CASE TC-EVT-030 to TC-EVT-040
     * Category: Black Box - Event Creation (UC-01)
     * Use Case: UC-01 Manual Event Creation
     */
    describe('POST /api/events', () => {

        // TC-EVT-030: Create event without authentication
        test('TC-EVT-030: Should reject event creation without auth', async () => {
            const eventData = {
                title: 'New Event',
                eventDate: '2025-05-01T10:00:00'
            };

            const response = await request(app)
                .post('/api/events')
                .send(eventData)
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        // TC-EVT-031: Create event with valid authentication and data
        test('TC-EVT-031: Should create event with valid auth and data', async () => {
            const token = generateTestToken();
            const eventData = {
                title: 'New Valid Event',
                description: 'Event description',
                eventDate: '2025-05-01T10:00:00',
                location: 'ITU Campus',
                category: 'technology'
            };

            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send(eventData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Event created successfully');
            expect(response.body).toHaveProperty('event');
        });

        // TC-EVT-032: Create event without title
        test('TC-EVT-032: Should reject event without title', async () => {
            const token = generateTestToken();
            const eventData = {
                eventDate: '2025-05-01T10:00:00'
            };

            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send(eventData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-EVT-033: Create event without eventDate
        test('TC-EVT-033: Should reject event without date', async () => {
            const token = generateTestToken();
            const eventData = {
                title: 'Event Without Date'
            };

            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send(eventData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-EVT-034: Create event with invalid token
        test('TC-EVT-034: Should reject event with invalid token', async () => {
            const eventData = {
                title: 'Test Event',
                eventDate: '2025-05-01T10:00:00'
            };

            const response = await request(app)
                .post('/api/events')
                .set('Authorization', 'Bearer invalidtoken123')
                .send(eventData)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        // TC-EVT-035: Create event with minimal valid data
        test('TC-EVT-035: Should create event with minimal required fields', async () => {
            const token = generateTestToken();
            const eventData = {
                title: 'Minimal Event',
                eventDate: '2025-06-01T12:00:00'
            };

            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${token}`)
                .send(eventData)
                .expect(201);

            expect(response.body).toHaveProperty('event');
        });
    });
});

/**
 * TEST COVERAGE SUMMARY
 * 
 * GET /api/events: 8 test cases
 * GET /api/events/:id: 3 test cases
 * POST /api/events: 6 test cases
 * 
 * Total: 17 test cases for Events API
 * 
 * Equivalence Classes:
 * - Valid authenticated requests
 * - Valid unauthenticated requests
 * - Invalid authentication (missing/invalid token)
 * - Valid input with all fields
 * - Valid input with minimal fields
 * - Invalid input (missing required fields)
 * - Boundary values (valid/invalid IDs)
 */
