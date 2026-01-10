import { useState, useCallback } from 'react';
import { useEvents, useCategories } from '../hooks/useEvents';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import EventGrid from '../components/EventGrid';

export default function HomePage() {
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        startDate: '',
        endDate: ''
    });

    const { events, loading, error } = useEvents(filters);
    const { categories } = useCategories();

    const handleSearch = useCallback((query) => {
        setFilters(prev => ({ ...prev, search: query }));
    }, []);

    const handleCategoryChange = useCallback((category) => {
        setFilters(prev => ({ ...prev, category }));
    }, []);

    const handleDateChange = useCallback((type, value) => {
        if (type === 'start') {
            setFilters(prev => ({ ...prev, startDate: value }));
        } else {
            setFilters(prev => ({ ...prev, endDate: value }));
        }
    }, []);

    return (
        <>
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">Discover Campus Events</h1>
                    <p className="hero-subtitle">
                        Find all ITU events in one place. From club meetings to concerts,
                        workshops to seminars – never miss what's happening on campus.
                    </p>
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Search for events, clubs, or topics..."
                    />
                </div>
            </section>

            {/* Main Content */}
            <main className="page">
                <div className="container">
                    {/* Filters */}
                    <FilterBar
                        categories={categories}
                        selectedCategory={filters.category}
                        onCategoryChange={handleCategoryChange}
                        onDateChange={handleDateChange}
                    />

                    {/* Stats */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-6)'
                    }}>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {loading ? 'Loading events...' : `Showing ${events.length} events`}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <span className="badge badge-success">✏️ Manual Events</span>
                            <span className="badge badge-info">🤖 Auto-scraped</span>
                        </div>
                    </div>

                    {/* Event Grid */}
                    <EventGrid events={events} loading={loading} error={error} />
                </div>
            </main>
        </>
    );
}
