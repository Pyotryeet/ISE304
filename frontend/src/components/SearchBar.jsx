import { useState } from 'react';

export default function SearchBar({ onSearch, placeholder = "Search events..." }) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    const handleChange = (e) => {
        setQuery(e.target.value);
        // Debounced search on type
        if (onSearch) {
            onSearch(e.target.value);
        }
    };

    return (
        <form className="search-bar" onSubmit={handleSubmit}>
            <span className="search-icon">🔍</span>
            <input
                type="text"
                className="search-input"
                placeholder={placeholder}
                value={query}
                onChange={handleChange}
            />
            <button type="submit" className="btn btn-primary btn-sm">
                Search
            </button>
        </form>
    );
}
