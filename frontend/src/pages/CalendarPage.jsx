import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch events for the calendar (fetching a larger batch)
        // In a real app, we would query by start/end date range
        fetch(`http://localhost:3001/api/events?limit=200`)
            .then(res => res.json())
            .then(data => {
                setEvents(data.events || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching calendar events:', err);
                setLoading(false);
            });
    }, []);

    // Calendar Helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay(); // 0 = Sunday
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const renderCalendarDays = () => {
        const totalDays = getDaysInMonth(currentDate);
        const startDay = getFirstDayOfMonth(currentDate); // 0 (Sun) to 6 (Sat)

        // Adjust for Monday start if preferred (ITU implies Turkey, usually Monday start)
        // But let's stick to Sunday start for standard JS compatiability for now or shift it.
        // Let's do Monday start: 0->6 becomes 6, 1->0, etc.
        const startDayAdjusted = startDay === 0 ? 6 : startDay - 1;

        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < startDayAdjusted; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty" style={{ background: 'var(--bg-secondary)', opacity: 0.3 }}></div>);
        }

        // Days of current month
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            // Find events for this day
            const dayEvents = events.filter(e => {
                if (!e.event_date) return false;
                // Simple string prefix match suffices for YYYY-MM-DD
                return e.event_date.startsWith(dateStr);
            });

            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();

            days.push(
                <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`} style={{
                    border: '1px solid var(--border-color)',
                    minHeight: '120px',
                    padding: '0.5rem',
                    backgroundColor: isToday ? 'rgba(255, 215, 0, 0.1)' : 'var(--bg-primary)',
                    position: 'relative'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            backgroundColor: isToday ? 'var(--primary-500)' : 'transparent',
                            color: isToday ? 'white' : 'inherit'
                        }}>{d}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {dayEvents.map(event => (
                            <Link to={`/events/${event.id}`} key={event.id} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: event.source === 'scraped' ? 'var(--purple-100)' : 'var(--blue-100)',
                                    color: event.source === 'scraped' ? 'var(--purple-800)' : 'var(--blue-800)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    cursor: 'pointer'
                                }} title={event.title}>
                                    {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {event.title}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (loading) return (
        <div className="page" style={{ textAlign: 'center', padding: '100px' }}>
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="page">
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Event Calendar</h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={prevMonth} className="btn btn-secondary">←</button>
                        <h2 style={{ fontSize: '1.5rem', minWidth: '200px', textAlign: 'center' }}>
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button onClick={nextMonth} className="btn btn-secondary">→</button>
                    </div>
                </div>

                <div className="calendar-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '1px',
                    backgroundColor: 'var(--border-color)', // Border effect
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    {/* Headers */}
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} style={{
                            padding: '1rem',
                            textAlign: 'center',
                            backgroundColor: 'var(--bg-secondary)',
                            fontWeight: 600
                        }}>
                            {day}
                        </div>
                    ))}

                    {/* Days */}
                    {renderCalendarDays()}
                </div>
            </div>
        </div>
    );
}

export default CalendarPage;
