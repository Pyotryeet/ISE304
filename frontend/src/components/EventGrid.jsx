import EventCard from './EventCard';

export default function EventGrid({ events, loading, error }) {
    if (loading) {
        return (
            <div className="event-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="event-card">
                        <div className="skeleton" style={{ height: '180px' }} />
                        <div className="event-card-content">
                            <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '12px' }} />
                            <div className="skeleton" style={{ height: '24px', marginBottom: '8px' }} />
                            <div className="skeleton" style={{ height: '16px', width: '40%' }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <h3 className="empty-state-title">Something went wrong</h3>
                <p className="empty-state-text">{error}</p>
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3 className="empty-state-title">No events found</h3>
                <p className="empty-state-text">
                    Try adjusting your search or filters to find events.
                </p>
            </div>
        );
    }

    return (
        <div className="event-grid">
            {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
}
