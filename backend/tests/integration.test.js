/**
 * THE HIVE - Integration Tests
 * End-to-End Integration Tests for API Workflows
 * 
 * Test Specification Document Reference: Section 2.2
 */

const request = require('supertest');

// Full integration test without mocking (uses real database)
// These tests require the server to be running

const BASE_URL = 'http://localhost:3001';

describe('Integration Tests - API Workflows', () => {

    /**
     * INTEGRATION TEST: Complete User Flow
     * Tests the full flow of UC-01, UC-03, UC-04
     */
    describe('IT-001: Complete Event Discovery Flow', () => {

        test('IT-001-A: Public user can browse published events', async () => {
            const response = await request(BASE_URL)
                .get('/api/events')
                .expect(200);

            expect(response.body).toHaveProperty('events');
            expect(response.body).toHaveProperty('pagination');
        });

        test('IT-001-B: Public user can search events by keyword', async () => {
            const response = await request(BASE_URL)
                .get('/api/events?search=concert')
                .expect(200);

            expect(response.body).toHaveProperty('events');
        });

        test('IT-001-C: Public user can filter events by category', async () => {
            const response = await request(BASE_URL)
                .get('/api/events?category=music')
                .expect(200);

            expect(response.body).toHaveProperty('events');
        });

        test('IT-001-D: Public user can view event details', async () => {
            // First get an event ID
            const listResponse = await request(BASE_URL)
                .get('/api/events?limit=1')
                .expect(200);

            if (listResponse.body.events.length > 0) {
                const eventId = listResponse.body.events[0].id;

                const detailResponse = await request(BASE_URL)
                    .get(`/api/events/${eventId}`)
                    .expect(200);

                expect(detailResponse.body).toHaveProperty('id', eventId);
                expect(detailResponse.body).toHaveProperty('title');
            }
        });
    });

    /**
     * INTEGRATION TEST: Club Admin Authentication Flow
     */
    describe('IT-002: Authentication Flow', () => {

        let authToken = null;

        test('IT-002-A: Club can login with valid credentials', async () => {
            const response = await request(BASE_URL)
                .post('/api/auth/login')
                .send({
                    email: 'music@itu.edu.tr',
                    password: 'club123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('club');
            authToken = response.body.token;
        });

        test('IT-002-B: Authenticated user can access protected route', async () => {
            if (!authToken) {
                // Get token first
                const loginResponse = await request(BASE_URL)
                    .post('/api/auth/login')
                    .send({
                        email: 'music@itu.edu.tr',
                        password: 'club123'
                    });
                authToken = loginResponse.body.token;
            }

            const response = await request(BASE_URL)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name');
        });

        test('IT-002-C: Invalid credentials are rejected', async () => {
            const response = await request(BASE_URL)
                .post('/api/auth/login')
                .send({
                    email: 'music@itu.edu.tr',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    /**
     * INTEGRATION TEST: Reminder Flow (UC-04)
     */
    describe('IT-003: Reminder Setup Flow', () => {

        const testEmail = `test${Date.now()}@itu.edu.tr`;

        test('IT-003-A: User can set reminder for published event', async () => {
            // Get a published event
            const eventsResponse = await request(BASE_URL)
                .get('/api/events?limit=1')
                .expect(200);

            if (eventsResponse.body.events.length > 0) {
                const eventId = eventsResponse.body.events[0].id;

                const response = await request(BASE_URL)
                    .post('/api/reminders')
                    .send({
                        email: testEmail,
                        eventId: eventId
                    })
                    .expect(201);

                expect(response.body).toHaveProperty('message', 'Reminder set successfully');
            }
        });

        test('IT-003-B: User can check if reminder exists', async () => {
            const eventsResponse = await request(BASE_URL)
                .get('/api/events?limit=1')
                .expect(200);

            if (eventsResponse.body.events.length > 0) {
                const eventId = eventsResponse.body.events[0].id;

                const response = await request(BASE_URL)
                    .get(`/api/reminders/check?email=${testEmail}&eventId=${eventId}`)
                    .expect(200);

                expect(response.body).toHaveProperty('hasReminder');
            }
        });

        test('IT-003-C: User can view their reminders', async () => {
            const response = await request(BASE_URL)
                .get(`/api/reminders?email=${testEmail}`)
                .expect(200);

            expect(response.body).toHaveProperty('reminders');
            expect(Array.isArray(response.body.reminders)).toBe(true);
        });
    });

    /**
     * INTEGRATION TEST: API Health and Documentation
     */
    describe('IT-004: API Infrastructure', () => {

        test('IT-004-A: Health endpoint returns OK', async () => {
            const response = await request(BASE_URL)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('service', 'The Hive API');
        });

        test('IT-004-B: API documentation endpoint works', async () => {
            const response = await request(BASE_URL)
                .get('/api')
                .expect(200);

            expect(response.body).toHaveProperty('name', 'The Hive API');
            expect(response.body).toHaveProperty('endpoints');
        });

        test('IT-004-C: 404 for unknown endpoints', async () => {
            const response = await request(BASE_URL)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });
});

/**
 * INTEGRATION TEST SUMMARY
 * 
 * IT-001: Event Discovery Flow - 4 tests
 * IT-002: Authentication Flow - 3 tests
 * IT-003: Reminder Setup Flow - 3 tests
 * IT-004: API Infrastructure - 3 tests
 * 
 * Total: 13 integration tests
 * 
 * Components Tested Together:
 * - Frontend Component ↔ Backend API Component
 * - Backend API ↔ Database Component
 * - Authentication Middleware ↔ All Protected Routes
 */
