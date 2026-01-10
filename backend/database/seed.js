/**
 * Database Seed Script
 * Creates sample data for testing The Hive platform
 */

const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('Waiting for database...');
    await db.ready;
    console.log('Database ready, seeding data...');

    // Create admin club
    const adminPassword = await bcrypt.hash('admin123', 10);
    db.prepare(`
        INSERT OR IGNORE INTO clubs (name, email, password_hash, is_admin)
        VALUES (?, ?, ?, ?)
    `).run('System Admin', 'admin@itu.edu.tr', adminPassword, 1);
    console.log('✓ Created admin user (admin@itu.edu.tr / admin123)');

    // Create sample clubs
    const clubs = [
        { name: 'ITU Music Club', email: 'music@itu.edu.tr', instagram: 'https://instagram.com/itumuzikkulubu' },
        { name: 'ITU ACM Chapter', email: 'acm@itu.edu.tr', instagram: 'https://instagram.com/ituacm' },
        { name: 'ITU Sports Club', email: 'sports@itu.edu.tr', instagram: 'https://instagram.com/itusportsclub' },
        { name: 'ITU Art Society', email: 'art@itu.edu.tr', instagram: 'https://instagram.com/ituart' },
    ];

    const clubPassword = await bcrypt.hash('club123', 10);
    for (const club of clubs) {
        db.prepare(`
            INSERT OR IGNORE INTO clubs (name, email, password_hash, instagram_url)
            VALUES (?, ?, ?, ?)
        `).run(club.name, club.email, clubPassword, club.instagram);
    }
    console.log('✓ Created sample clubs (password: club123)');

    // Create sample events
    const events = [
        {
            club_id: 2,
            title: 'Spring Concert 2025',
            description: 'Join us for an amazing night of live music featuring student bands and guest performers!',
            event_date: '2025-03-15T19:00:00',
            location: 'ITU Stadium',
            category: 'music',
            status: 'published',
            source: 'manual'
        },
        {
            club_id: 3,
            title: 'Hackathon: Build for Good',
            description: '24-hour coding competition to build solutions for social impact. Prizes worth $5000!',
            event_date: '2025-02-20T09:00:00',
            end_date: '2025-02-21T09:00:00',
            location: 'ITU Computer Science Building',
            category: 'technology',
            status: 'published',
            source: 'manual'
        },
        {
            club_id: 4,
            title: 'Basketball Tournament Finals',
            description: 'Watch the exciting finals of the inter-department basketball tournament.',
            event_date: '2025-01-25T15:00:00',
            location: 'ITU Sports Hall',
            category: 'sports',
            status: 'published',
            source: 'manual'
        },
        {
            club_id: 5,
            title: 'Modern Art Workshop',
            description: 'Learn contemporary art techniques from professional artists. All materials provided.',
            event_date: '2025-02-05T14:00:00',
            location: 'ITU Art Studio, Building A',
            category: 'art',
            status: 'published',
            source: 'manual'
        },
        {
            club_id: 3,
            title: 'AI in Music: Tech Talk',
            description: 'Explore how AI is revolutionizing music creation and production.',
            event_date: '2025-02-10T18:00:00',
            location: 'ITU EEB Main Auditorium',
            category: 'technology',
            status: 'published',
            source: 'scraped'
        },
        {
            club_id: 2,
            title: 'Jazz Night',
            description: 'An evening of smooth jazz performed by the ITU Jazz Ensemble.',
            event_date: '2025-02-28T20:00:00',
            location: 'ITU Süleyman Demirel Cultural Center',
            category: 'music',
            status: 'published',
            source: 'manual'
        },
        {
            club_id: 3,
            title: 'Web Development Bootcamp',
            description: 'Intensive 3-day workshop on modern web development. React, Node.js, and more!',
            event_date: '2025-03-01T10:00:00',
            end_date: '2025-03-03T17:00:00',
            location: 'ITU CS Lab 101',
            category: 'workshop',
            status: 'published',
            source: 'manual'
        },
        {
            club_id: 4,
            title: 'Swimming Competition',
            description: 'Annual inter-university swimming championship.',
            event_date: '2025-03-10T09:00:00',
            location: 'ITU Olympic Pool',
            category: 'sports',
            status: 'draft',
            source: 'scraped'
        }
    ];

    for (const event of events) {
        db.prepare(`
            INSERT OR IGNORE INTO events (club_id, title, description, event_date, end_date, location, category, status, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            event.club_id,
            event.title,
            event.description,
            event.event_date,
            event.end_date || null,
            event.location,
            event.category,
            event.status,
            event.source
        );
    }
    console.log('✓ Created sample events');

    // Add some scraped clubs
    const scrapedClubs = [
        { name: 'ITU IEEE', instagram: 'https://instagram.com/ituieee' },
        { name: 'ITU Entrepreneurship', instagram: 'https://instagram.com/ituentrepreneur' },
        { name: 'ITU Dance Club', instagram: 'https://instagram.com/itudance' },
    ];

    for (const club of scrapedClubs) {
        db.prepare(`
            INSERT OR IGNORE INTO scraped_clubs (name, instagram_url)
            VALUES (?, ?)
        `).run(club.name, club.instagram);
    }
    console.log('✓ Added scraped clubs');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('Test accounts:');
    console.log('  Admin:  admin@itu.edu.tr / admin123');
    console.log('  Club:   music@itu.edu.tr / club123');
}

seed().catch(console.error);
