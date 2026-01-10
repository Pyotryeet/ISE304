const express = require('express');
const router = express.Router();
const db = require('../database/db');

// POST /api/reminders - Set a reminder for an event
router.post('/', (req, res) => {
    try {
        const { email, eventId, remindAt } = req.body;

        // Validate required fields
        if (!email || !eventId) {
            return res.status(400).json({ error: 'Email and event ID are required' });
        }

        // Check if event exists and is published
        const event = db.prepare('SELECT * FROM events WHERE id = ? AND status = ?').get(eventId, 'published');
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Find or create student
        let student = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
        if (!student) {
            const result = db.prepare('INSERT INTO students (email) VALUES (?)').run(email);
            student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
        }

        // Check if reminder already exists
        const existingReminder = db.prepare(
            'SELECT * FROM reminders WHERE student_id = ? AND event_id = ?'
        ).get(student.id, eventId);

        if (existingReminder) {
            return res.status(409).json({ error: 'Reminder already set for this event' });
        }

        // Create reminder
        const result = db.prepare(`
            INSERT INTO reminders (student_id, event_id, remind_at)
            VALUES (?, ?, ?)
        `).run(student.id, eventId, remindAt || null);

        res.status(201).json({
            message: 'Reminder set successfully',
            reminder: {
                id: result.lastInsertRowid,
                eventId,
                eventTitle: event.title,
                eventDate: event.event_date
            }
        });
    } catch (error) {
        console.error('Error setting reminder:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reminders - Get reminders for a student
router.get('/', (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
        if (!student) {
            return res.json({ reminders: [] });
        }

        const reminders = db.prepare(`
            SELECT 
                r.id,
                r.remind_at,
                r.created_at,
                e.id as event_id,
                e.title as event_title,
                e.event_date,
                e.location,
                c.name as club_name
            FROM reminders r
            JOIN events e ON r.event_id = e.id
            LEFT JOIN clubs c ON e.club_id = c.id
            WHERE r.student_id = ? AND e.status = 'published'
            ORDER BY e.event_date ASC
        `).all(student.id);

        res.json({ reminders });
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/reminders/:id - Remove a reminder
router.delete('/:id', (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND student_id = ?').get(req.params.id, student.id);
        if (!reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);

        res.json({ message: 'Reminder removed successfully' });
    } catch (error) {
        console.error('Error removing reminder:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reminders/check - Check if reminder exists for event
router.get('/check', (req, res) => {
    try {
        const { email, eventId } = req.query;

        if (!email || !eventId) {
            return res.status(400).json({ error: 'Email and event ID are required' });
        }

        const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
        if (!student) {
            return res.json({ hasReminder: false });
        }

        const reminder = db.prepare(
            'SELECT * FROM reminders WHERE student_id = ? AND event_id = ?'
        ).get(student.id, eventId);

        res.json({ hasReminder: !!reminder, reminderId: reminder?.id });
    } catch (error) {
        console.error('Error checking reminder:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
