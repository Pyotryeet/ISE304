import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryEmoji = (category) => {
        const emojis = {
            'music': '🎵',
            'sports': '⚽',
            'technology': '💻',
            'art': '🎨',
            'academic': '📚',
            'social': '🎉',
            'career': '💼',
            'workshop': '🔧',
            'seminar': '🎤',
            'default': '📅'
        };
        return emojis[category?.toLowerCase()] || emojis.default;
    };

    return (
        <Link to={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
            {/* DEBUG LOG */}
            {console.log(`Event ${event.id} location:`, event.location)}
            <article className="event-card">
                {/* Source Badge */}
                <span className={`event-card-badge ${event.source}`}>
                    {event.source === 'scraped' ? '🤖 Auto' : '✏️ Manual'}
                </span>

                {/* Content */}
                <div className="event-card-content">
                    {/* Date */}
                    <div className="event-card-date">
                        <span>📅</span>
                        {formatDate(event.event_date)}
                    </div>

                    {/* Title */}
                    <h3 className="event-card-title">{event.title}</h3>

                    {/* Club */}
                    {event.club_name && (
                        <div className="event-card-club">
                            <span>🏛️</span>
                            {event.club_name}
                        </div>
                    )}

                    {/* Location */}
                    {event.location && (
                        <div className="event-card-location">
                            <span>📍</span>
                            {event.location}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="event-card-footer">
                    {event.category && (
                        <span className="badge badge-primary">
                            {getCategoryEmoji(event.category)} {event.category}
                        </span>
                    )}
                    <span style={{ color: 'var(--primary-600)', fontWeight: 500 }}>
                        View Details →
                    </span>
                </div>
            </article>
        </Link>
    );
}
