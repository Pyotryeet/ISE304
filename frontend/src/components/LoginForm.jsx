import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        instagramUrl: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData.name, formData.email, formData.password, formData.instagramUrl);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
                <div className="card-body" style={{ padding: 'var(--space-8)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                        <span style={{ fontSize: '3rem' }}>🐝</span>
                        <h2 style={{ marginTop: 'var(--space-4)' }}>
                            {isLogin ? 'Welcome Back' : 'Join The Hive'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                            {isLogin
                                ? 'Sign in to manage your club events'
                                : 'Register your club to start posting events'}
                        </p>
                    </div>

                    {error && (
                        <div className="toast error" style={{ marginBottom: 'var(--space-4)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="form-group">
                                <label className="form-label">Club Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="Enter your club name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="club@itu.edu.tr"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>

                        {!isLogin && (
                            <div className="form-group">
                                <label className="form-label">Instagram URL (optional)</label>
                                <input
                                    type="url"
                                    name="instagramUrl"
                                    className="form-input"
                                    placeholder="https://instagram.com/yourclub"
                                    value={formData.instagramUrl}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: 'var(--space-4)' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner" style={{ width: '20px', height: '20px' }} />
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-600)',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                {isLogin ? 'Register' : 'Sign In'}
                            </button>
                        </p>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                        <Link to="/" style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                            ← Back to Events
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
