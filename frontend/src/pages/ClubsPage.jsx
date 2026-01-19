import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function ClubsPage() {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('http://localhost:3001/api/clubs')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch clubs');
                return res.json();
            })
            .then(data => {
                setClubs(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const filteredClubs = clubs.filter(club =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="page" style={{ textAlign: 'center', padding: '100px' }}>
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="page">
            <div className="container">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-6)'
                }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            Student Clubs
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Discover active communities at ITU
                        </p>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <span style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '1rem'
                        }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search clubs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                borderRadius: '50px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                width: '300px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                        Error: {error}
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 'var(--space-6)'
                }}>
                    {filteredClubs.map(club => (
                        <div key={club.id} className="card club-card" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '2rem'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${getRandomColor(club.name)}, ${getRandomColor(club.name + 'sec')})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                marginBottom: '1rem',
                                color: 'white',
                                fontWeight: 'bold'
                            }}>
                                {club.name.charAt(0).toUpperCase()}
                            </div>

                            <h3 style={{ marginBottom: '0.5rem' }}>{club.name}</h3>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
                                {club.instagram_url && (
                                    <a
                                        href={club.instagram_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                    >
                                        Instagram ↗
                                    </a>
                                )}
                                {/* We could add link to club's events page here if we had one */}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredClubs.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        No clubs found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to generate consistent colors based on string
function getRandomColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export default ClubsPage;
