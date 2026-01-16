/**
 * THE HIVE - Authentication API Tests
 * Unit and Integration Tests for /api/auth endpoints
 * 
 * Test Specification Document Reference: Section 2.3, 2.4
 */

const request = require('supertest');

// Mock the database before requiring the app
jest.mock('../database/db', () => {
    const mockData = {
        clubs: [],
        nextId: 1
    };

    return {
        ready: Promise.resolve(),
        isReady: () => true,
        prepare: jest.fn((sql) => ({
            get: jest.fn((...params) => {
                if (sql.includes('SELECT') && sql.includes('clubs')) {
                    if (sql.includes('email = ?')) {
                        return mockData.clubs.find(c => c.email === params[0]);
                    }
                    if (sql.includes('id = ?')) {
                        return mockData.clubs.find(c => c.id === params[0]);
                    }
                }
                return undefined;
            }),
            all: jest.fn(() => []),
            run: jest.fn((...params) => {
                if (sql.includes('INSERT INTO clubs')) {
                    const newClub = {
                        id: mockData.nextId++,
                        name: params[0],
                        email: params[1],
                        password_hash: params[2],
                        instagram_url: params[3],
                        is_admin: 0
                    };
                    mockData.clubs.push(newClub);
                    return { lastInsertRowid: newClub.id, changes: 1 };
                }
                return { lastInsertRowid: 0, changes: 0 };
            })
        })),
        exec: jest.fn(),
        pragma: jest.fn(),
        _mockData: mockData,
        _reset: () => {
            mockData.clubs = [];
            mockData.nextId = 1;
        }
    };
});

const express = require('express');
const authRoutes = require('../routes/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API Tests', () => {
    beforeEach(() => {
        // Reset mock data before each test
        const db = require('../database/db');
        db._reset();
    });

    /**
     * TEST CASE TC-AUTH-001
     * Category: Black Box - Equivalence Partitioning (Valid Input)
     * Use Case: UC-01 Manual Event Creation (Authentication step)
     */
    describe('POST /api/auth/register', () => {

        // TC-AUTH-001: Valid registration with all required fields
        test('TC-AUTH-001: Should register a new club with valid data', async () => {
            const validClubData = {
                name: 'Test Club',
                email: 'testclub@itu.edu.tr',
                password: 'securePassword123',
                instagramUrl: 'https://instagram.com/testclub'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(validClubData)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Club registered successfully');
            expect(response.body).toHaveProperty('token');
            expect(response.body.club).toHaveProperty('name', 'Test Club');
            expect(response.body.club).toHaveProperty('email', 'testclub@itu.edu.tr');
        });

        // TC-AUTH-002: Missing required field - name
        test('TC-AUTH-002: Should reject registration without name', async () => {
            const invalidData = {
                email: 'test@itu.edu.tr',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-AUTH-003: Missing required field - email
        test('TC-AUTH-003: Should reject registration without email', async () => {
            const invalidData = {
                name: 'Test Club',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-AUTH-004: Missing required field - password
        test('TC-AUTH-004: Should reject registration without password', async () => {
            const invalidData = {
                name: 'Test Club',
                email: 'test@itu.edu.tr'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-AUTH-005: Empty request body
        test('TC-AUTH-005: Should reject empty request body', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-AUTH-006: Valid registration without optional instagramUrl
        test('TC-AUTH-006: Should register without optional instagramUrl', async () => {
            const validData = {
                name: 'Minimal Club',
                email: 'minimal@itu.edu.tr',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(validData)
                .expect(201);

            expect(response.body).toHaveProperty('token');
        });
    });

    /**
     * TEST CASE TC-AUTH-010 to TC-AUTH-015
     * Category: Black Box - Login Tests
     * Use Case: UC-01 Manual Event Creation (Login step)
     */
    describe('POST /api/auth/login', () => {

        // TC-AUTH-010: Missing email
        test('TC-AUTH-010: Should reject login without email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password123' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-AUTH-011: Missing password
        test('TC-AUTH-011: Should reject login without password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@itu.edu.tr' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        // TC-AUTH-012: Invalid credentials - wrong email
        test('TC-AUTH-012: Should reject login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@itu.edu.tr',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        // TC-AUTH-013: Empty request body
        test('TC-AUTH-013: Should reject empty login request', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});

/**
 * TEST COVERAGE REPORT
 * 
 * Functions Tested:
 * - POST /api/auth/register (6 test cases)
 * - POST /api/auth/login (4 test cases)
 * - GET /api/auth/me (requires additional tests)
 * 
 * Equivalence Classes Covered:
 * - Valid input with all fields
 * - Valid input with optional fields missing
 * - Invalid input - missing required fields
 * - Invalid input - empty body
 * - Invalid credentials
 */
