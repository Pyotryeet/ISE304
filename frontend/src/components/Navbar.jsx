import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/" className="navbar-brand">
                    <span className="icon">🐝</span>
                    <span>The Hive</span>
                </Link>

                <ul className={`navbar-nav ${mobileMenuOpen ? 'open' : ''}`}>
                    <li>
                        <Link to="/" className={isActive('/') ? 'active' : ''}>
                            Events
                        </Link>
                    </li>
                    <li>
                        <Link to="/calendar" className={isActive('/calendar') ? 'active' : ''}>
                            Calendar
                        </Link>
                    </li>
                    <li>
                        <Link to="/clubs" className={isActive('/clubs') ? 'active' : ''}>
                            Clubs
                        </Link>
                    </li>
                    {user && (
                        <li>
                            <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                                Dashboard
                            </Link>
                        </li>
                    )}
                </ul>

                <div className="navbar-actions">
                    {user ? (
                        <>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {user.name}
                            </span>
                            <button className="btn btn-ghost btn-sm" onClick={logout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm">
                            Club Login
                        </Link>
                    )}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>
        </nav>
    );
}
