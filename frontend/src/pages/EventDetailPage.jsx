import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useEvent } from '../hooks/useEvents';

const API_URL = 'http://localhost:3001/api';

export default function EventDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { event, loading, error } = useEvent(id);

    const [reminderEmail, setReminderEmail] = useState('');
    const [reminderStatus, setReminderStatus] = useState({ type: '', message: '' });
    const [settingReminder, setSettingReminder] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSetReminder = async (e) => {
        e.preventDefault();
        if (!reminderEmail) return;

        setSettingReminder(true);
        setReminderStatus({ type: '', message: '' });

        try {
            const response = await fetch(`${API_URL}/reminders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: reminderEmail, eventId: id })
            });

            const data = await response.json();

            if (response.ok) {
                setReminderStatus({ type: 'success', message: 'Reminder set successfully! 🎉' });
                setReminderEmail('');
            } else {
                setReminderStatus({ type: 'error', message: data.error || 'Failed to set reminder' });
            }
        } catch (err) {
            setReminderStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
        } finally {
            setSettingReminder(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="page">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3 className="empty-state-title">Event not found</h3>
                        <p className="empty-state-text">{error || 'This event may have been removed or the link is incorrect.'}</p>
                        <Link to="/" className="btn btn-primary">Back to Events</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-ghost"
                    style={{ marginBottom: 'var(--space-4)' }}
                >
                    ← Back
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
                    {/* Main Content */}
                    <div>
                        {/* Image */}
                        {event.image_url ? (
                            <img
                                src={event.image_url}
                                alt={event.title}
                                style={{
                                    width: '100%',
                                    height: '400px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-xl)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '400px',
                                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--accent-400) 100%)',
                                borderRadius: 'var(--radius-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '6rem'
                            }}>
                                📅
                            </div>
                        )}

                        {/* Title and Meta */}
                        <div style={{ marginTop: 'var(--space-6)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                                <span className={`badge ${event.source === 'scraped' ? 'badge-info' : 'badge-success'}`}>
                                    {event.source === 'scraped' ? '🤖 Auto-scraped' : '✏️ Manual Entry'}
                                </span>
                                {event.category && (
                                    <span className="badge badge-primary">{event.category}</span>
                                )}
                            </div>

                            <h1 style={{ marginBottom: 'var(--space-4)' }}>{event.title}</h1>

                            {event.description && (
                                <div style={{
                                    padding: 'var(--space-5)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    marginTop: 'var(--space-4)'
                                }}>
                                    <h3 style={{ marginBottom: 'var(--space-3)' }}>About this event</h3>
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
                                </div>
                            )}

                            {event.instagram_post_url && (
                                <a
                                    href={event.instagram_post_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={{ marginTop: 'var(--space-4)' }}
                                >
                                    View on Instagram →
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div>
                        {/* Event Details Card */}
                        <div className="card" style={{ position: 'sticky', top: '100px' }}>
                            <div className="card-body">
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>Event Details</h3>

                                {/* Date */}
                                <div style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--primary-50)',
                                    borderRadius: 'var(--radius-lg)',
                                    marginBottom: 'var(--space-4)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--primary-700)' }}>
                                        <span style={{ fontSize: '1.5rem' }}>📅</span>
                                        <div>
                                            <p style={{ fontWeight: 600, margin: 0 }}>{formatDate(event.event_date)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                {event.location && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 'var(--space-3)',
                                        marginBottom: 'var(--space-4)'
                                    }}>
                                        <span style={{ fontSize: '1.25rem' }}>📍</span>
                                        <div>
                                            <p style={{ fontWeight: 500, margin: 0 }}>Location</p>
                                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{event.location}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Club */}
                                {event.club_name && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 'var(--space-3)',
                                        marginBottom: 'var(--space-4)'
                                    }}>
                                        <span style={{ fontSize: '1.25rem' }}>🏛️</span>
                                        <div>
                                            <p style={{ fontWeight: 500, margin: 0 }}>Organized by</p>
                                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{event.club_name}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Reminder Form */}
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: 'var(--space-4)',
                                    marginTop: 'var(--space-4)'
                                }}>
                                    <h4 style={{ marginBottom: 'var(--space-3)' }}>🔔 Set Reminder</h4>

                                    {reminderStatus.message && (
                                        <div className={`toast ${reminderStatus.type}`} style={{ marginBottom: 'var(--space-3)' }}>
                                            {reminderStatus.message}
                                        </div>
                                    )}

                                    <form onSubmit={handleSetReminder}>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="Enter your email"
                                            value={reminderEmail}
                                            onChange={(e) => setReminderEmail(e.target.value)}
                                            required
                                            style={{ marginBottom: 'var(--space-3)' }}
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-accent"
                                            style={{ width: '100%' }}
                                            disabled={settingReminder}
                                        >
                                            {settingReminder ? 'Setting...' : 'Remind Me 🔔'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responsive styles for mobile */}
            <style>{`
        @media (max-width: 768px) {
          .container > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
}
