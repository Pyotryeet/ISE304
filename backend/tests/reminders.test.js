/**
 * THE HIVE - Reminders API Tests
 * Unit and Integration Tests for /api/reminders endpoints
 * 
 * Test Specification Document Reference: Section 2.3, 2.4
 * Use Case Reference: UC-04 Reminder Setup
 */

const request = require('supertest');

// Mock database
jest.mock('../database/db', () => {
    const mockData = {
        students: [
            { id: 1, email: 'student@itu.edu.tr', name: 'Test Student' }
        ],
        events: [
            { id: 1, title: 'Test Event', event_date: '2025-03-15T14:00:00', status: 'published' }
        ],
        reminders: []
    };

    return {
        ready: Promise.resolve(),
        isReady: () => true,
        prepare: jest.fn((sql) => ({
            get: jest.fn((...params) => {
                if (sql.includes('students') && sql.includes('email')) {
                    return mockData.students.find(s => s.email === params[0]);
                }
                if (sql.includes('events') && sql.includes('id = ?')) {
                    const event = mockData.events.find(e => e.id === params[0]);
                    if (event && params[1] === 'published' && event.status !== 'published') {
                        return undefined;
                    }
                    return event;
                }
                if (sql.includes('reminders') && sql.includes('student_id') && sql.includes('event_id')) {
                    return mockData.reminders.find(r =>
                        r.student_id === params[0] && r.event_id === params[1]
                    );
                }
                return undefined;
            }),
            all: jest.fn((...params) => {
                return mockData.reminders.filter(r => r.student_id === params[0]);
            }),
            run: jest.fn((...params) => {
                if (sql.includes('INSERT INTO students')) {
                    const newStudent = { id: mockData.students.length + 1, email: params[0] };
                    mockData.students.push(newStudent);
                    return { lastInsertRowid: newStudent.id, changes: 1 };
                }
                if (sql.includes('INSERT INTO reminders')) {
                    const newReminder = {
                        id: mockData.reminders.length + 1,
                        student_id: params[0],
                        event_id: params[1],
                        remind_at: params[2]
                    };
                    mockData.reminders.push(newReminder);
                    return { lastInsertRowid: newReminder.id, changes: 1 };
                }
                if (sql.includes('DELETE FROM reminders')) {
                    const index = mockData.reminders.findIndex(r => r.id === params[0]);
                    if (index > -1) {
                        mockData.reminders.splice(index, 1);
                    }
                    return { changes: index > -1 ? 1 : 0 };
                }
                return { lastInsertRowid: 0, changes: 0 };
            })
        })),
        exec: jest.fn(),
        pragma: jest.fn(),
        _mockData: mockData,
        _reset: () => {
            mockData.reminders = [];
        }
    };
});

const express = require('express');
const remindersRoutes = require('../routes/reminders');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/reminders', remindersRoutes);

describe('Reminders API Tests', () => {
    beforeEach(() => {
        const db = require('../database/db');
        db._reset();
    });

    /**
     * TEST CASE TC-REM-001 to TC-REM-010
     * Category: Black Box - Reminder Setup (UC-04)
     * Use Case: UC-04 Reminder Setup
     */
    describe('POST /api/reminders', () => {

        // TC-REM-001: Create reminder with valid data
        test('TC-REM-001: Should create reminder with valid email and eventId', async () => {
            const reminderData = {
                email: 'newstudent@itu.edu.tr',
                eventId: 1
            };

            const response = await request(app)
                .post('/api/reminders')
                .send(reminderData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Reminder set successfully');
            expect(response.body.reminder).toHaveProperty('eventId', 1);
        });

        // TC-REM-002: Create reminder without email
        test('TC-REM-002: Should reject reminder without email', async () => {
            const response = await request(app)
                .post('/api/reminders')
                .send({ eventId: 1 })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-REM-003: Create reminder without eventId
        test('TC-REM-003: Should reject reminder without eventId', async () => {
            const response = await request(app)
                .post('/api/reminders')
                .send({ email: 'test@itu.edu.tr' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-REM-004: Create reminder for non-existent event
        test('TC-REM-004: Should reject reminder for invalid eventId', async () => {
            const response = await request(app)
                .post('/api/reminders')
                .send({ email: 'test@itu.edu.tr', eventId: 9999 })
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Event not found');
        });

        // TC-REM-005: Empty request body
        test('TC-REM-005: Should reject empty request', async () => {
            const response = await request(app)
                .post('/api/reminders')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-REM-006: Valid email format validation (boundary)
        test('TC-REM-006: Should accept valid email format', async () => {
            const response = await request(app)
                .post('/api/reminders')
                .send({ email: 'valid.email@domain.com', eventId: 1 })
                .expect(201);

            expect(response.body).toHaveProperty('message');
        });
    });

    /**
     * TEST CASE TC-REM-010 to TC-REM-015
     * Category: Black Box - Get Reminders
     */
    describe('GET /api/reminders', () => {

        // TC-REM-010: Get reminders with valid email
        test('TC-REM-010: Should return reminders for valid email', async () => {
            const response = await request(app)
                .get('/api/reminders?email=student@itu.edu.tr')
                .expect(200);

            expect(response.body).toHaveProperty('reminders');
            expect(Array.isArray(response.body.reminders)).toBe(true);
        });

        // TC-REM-011: Get reminders without email parameter
        test('TC-REM-011: Should reject request without email', async () => {
            const response = await request(app)
                .get('/api/reminders')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-REM-012: Get reminders for non-existent student
        test('TC-REM-012: Should return empty array for unknown email', async () => {
            const response = await request(app)
                .get('/api/reminders?email=unknown@itu.edu.tr')
                .expect(200);

            expect(response.body.reminders).toEqual([]);
        });
    });

    /**
     * TEST CASE TC-REM-020 to TC-REM-025
     * Category: Black Box - Check Reminder Exists
     */
    describe('GET /api/reminders/check', () => {

        // TC-REM-020: Check reminder with valid parameters
        test('TC-REM-020: Should check reminder existence', async () => {
            const response = await request(app)
                .get('/api/reminders/check?email=student@itu.edu.tr&eventId=1')
                .expect(200);

            expect(response.body).toHaveProperty('hasReminder');
            expect(typeof response.body.hasReminder).toBe('boolean');
        });

        // TC-REM-021: Check reminder without email
        test('TC-REM-021: Should reject check without email', async () => {
            const response = await request(app)
                .get('/api/reminders/check?eventId=1')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-REM-022: Check reminder without eventId
        test('TC-REM-022: Should reject check without eventId', async () => {
            const response = await request(app)
                .get('/api/reminders/check?email=test@itu.edu.tr')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});

/**
 * TEST COVERAGE SUMMARY
 * 
 * POST /api/reminders: 6 test cases
 * GET /api/reminders: 3 test cases
 * GET /api/reminders/check: 3 test cases
 * 
 * Total: 12 test cases for Reminders API
 * 
 * Use Case Coverage:
 * - UC-04 Reminder Setup: Full flow covered
 */
