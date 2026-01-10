import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createEvent, updateEvent, deleteEvent } from '../hooks/useEvents';

const API_URL = 'http://localhost:3001/api';

export default function DashboardPage() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('events');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventDate: '',
        endDate: '',
        location: '',
        category: '',
        imageUrl: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchEvents();
    }, [user, navigate]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/events?clubId=${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setEvents(data.events || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingEvent) {
                await updateEvent(editingEvent.id, formData, token);
                setSuccess('Event updated successfully!');
            } else {
                await createEvent(formData, token);
                setSuccess('Event created successfully!');
            }

            setShowEventModal(false);
            setEditingEvent(null);
            setFormData({
                title: '',
                description: '',
                eventDate: '',
                endDate: '',
                location: '',
                category: '',
                imageUrl: ''
            });
            fetchEvents();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            eventDate: event.event_date?.slice(0, 16) || '',
            endDate: event.end_date?.slice(0, 16) || '',
            location: event.location || '',
            category: event.category || '',
            imageUrl: event.image_url || ''
        });
        setShowEventModal(true);
    };

    const handleDelete = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await deleteEvent(eventId, token);
            setSuccess('Event deleted successfully!');
            fetchEvents();
        } catch (err) {
            setError(err.message);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'draft': 'badge-warning',
            'pending_review': 'badge-info',
            'published': 'badge-success',
            'archived': 'badge-error'
        };
        return badges[status] || 'badge-primary';
    };

    if (!user) {
        return null;
    }

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
                        CLUB DASHBOARD
                    </h3>
                    <h2 style={{ fontSize: '1.25rem' }}>{user.name}</h2>
                </div>

                <nav>
                    <ul className="dashboard-nav">
                        <li className="dashboard-nav-item">
                            <a
                                href="#events"
                                className={`dashboard-nav-link ${activeTab === 'events' ? 'active' : ''}`}
                                onClick={() => setActiveTab('events')}
                            >
                                📅 My Events
                            </a>
                        </li>
                        <li className="dashboard-nav-item">
                            <a
                                href="#create"
                                className={`dashboard-nav-link ${activeTab === 'create' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab('create');
                                    setEditingEvent(null);
                                    setFormData({
                                        title: '',
                                        description: '',
                                        eventDate: '',
                                        endDate: '',
                                        location: '',
                                        category: '',
                                        imageUrl: ''
                                    });
                                    setShowEventModal(true);
                                }}
                            >
                                ➕ Create Event
                            </a>
                        </li>
                        <li className="dashboard-nav-item">
                            <a
                                href="#settings"
                                className={`dashboard-nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                ⚙️ Settings
                            </a>
                        </li>
                    </ul>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
                    <Link to="/" className="btn btn-ghost" style={{ width: '100%', marginBottom: 'var(--space-2)' }}>
                        ← Back to Home
                    </Link>
                    <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-content">
                {/* Messages */}
                {success && (
                    <div className="toast success" style={{ marginBottom: 'var(--space-4)' }}>
                        ✅ {success}
                    </div>
                )}
                {error && (
                    <div className="toast error" style={{ marginBottom: 'var(--space-4)' }}>
                        ❌ {error}
                    </div>
                )}

                {/* Events List */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-6)'
                }}>
                    <h2>My Events</h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingEvent(null);
                            setFormData({
                                title: '',
                                description: '',
                                eventDate: '',
                                endDate: '',
                                location: '',
                                category: '',
                                imageUrl: ''
                            });
                            setShowEventModal(true);
                        }}
                    >
                        ➕ Create New Event
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <h3 className="empty-state-title">No events yet</h3>
                        <p className="empty-state-text">Create your first event to get started!</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowEventModal(true)}
                        >
                            Create Event
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {events.map(event => (
                            <div key={event.id} className="card">
                                <div className="card-body" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                            <h3 style={{ margin: 0 }}>{event.title}</h3>
                                            <span className={`badge ${getStatusBadge(event.status)}`}>
                                                {event.status}
                                            </span>
                                            <span className={`badge ${event.source === 'scraped' ? 'badge-info' : 'badge-success'}`}>
                                                {event.source}
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                            📅 {new Date(event.event_date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            {event.location && ` • 📍 ${event.location}`}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        <Link to={`/events/${event.id}`} className="btn btn-ghost btn-sm">
                                            👁️ View
                                        </Link>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleEdit(event)}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ color: 'var(--error)' }}
                                            onClick={() => handleDelete(event.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Event Modal */}
            {showEventModal && (
                <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingEvent ? 'Edit Event' : 'Create New Event'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowEventModal(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Event Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="form-input"
                                        placeholder="Enter event title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        name="description"
                                        className="form-textarea"
                                        placeholder="Tell people about your event..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Start Date & Time *</label>
                                        <input
                                            type="datetime-local"
                                            name="eventDate"
                                            className="form-input"
                                            value={formData.eventDate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">End Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            name="endDate"
                                            className="form-input"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        className="form-input"
                                        placeholder="Where is the event?"
                                        value={formData.location}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        name="category"
                                        className="form-select"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select a category</option>
                                        <option value="music">🎵 Music</option>
                                        <option value="sports">⚽ Sports</option>
                                        <option value="technology">💻 Technology</option>
                                        <option value="art">🎨 Art</option>
                                        <option value="academic">📚 Academic</option>
                                        <option value="social">🎉 Social</option>
                                        <option value="career">💼 Career</option>
                                        <option value="workshop">🔧 Workshop</option>
                                        <option value="seminar">🎤 Seminar</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Image URL</label>
                                    <input
                                        type="url"
                                        name="imageUrl"
                                        className="form-input"
                                        placeholder="https://example.com/image.jpg"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowEventModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingEvent ? 'Update Event' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
