export default function FilterBar({ categories, selectedCategory, onCategoryChange, onDateChange }) {
    const allCategories = [
        { id: '', name: 'All Events', emoji: '📅' },
        { id: 'music', name: 'Music', emoji: '🎵' },
        { id: 'sports', name: 'Sports', emoji: '⚽' },
        { id: 'technology', name: 'Technology', emoji: '💻' },
        { id: 'art', name: 'Art', emoji: '🎨' },
        { id: 'academic', name: 'Academic', emoji: '📚' },
        { id: 'social', name: 'Social', emoji: '🎉' },
        { id: 'career', name: 'Career', emoji: '💼' },
        { id: 'workshop', name: 'Workshop', emoji: '🔧' },
        { id: 'seminar', name: 'Seminar', emoji: '🎤' },
    ];

    // Use provided categories or default list
    const displayCategories = categories?.length > 0
        ? [{ id: '', name: 'All Events', emoji: '📅' }, ...categories.map(c => ({
            id: c,
            name: c,
            emoji: allCategories.find(ac => ac.id === c.toLowerCase())?.emoji || '📌'
        }))]
        : allCategories;

    return (
        <div className="filters">
            {displayCategories.map(cat => (
                <button
                    key={cat.id}
                    className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => onCategoryChange(cat.id)}
                >
                    <span>{cat.emoji}</span>
                    {cat.name}
                </button>
            ))}

            {onDateChange && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                        type="date"
                        className="form-input"
                        style={{ width: 'auto', padding: 'var(--space-2) var(--space-3)' }}
                        onChange={(e) => onDateChange('start', e.target.value)}
                        placeholder="Start date"
                    />
                    <input
                        type="date"
                        className="form-input"
                        style={{ width: 'auto', padding: 'var(--space-2) var(--space-3)' }}
                        onChange={(e) => onDateChange('end', e.target.value)}
                        placeholder="End date"
                    />
                </div>
            )}
        </div>
    );
}
