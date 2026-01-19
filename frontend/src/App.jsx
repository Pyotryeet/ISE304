import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import DashboardPage from './pages/DashboardPage';
import LoginForm from './components/LoginForm';
import ClubsPage from './pages/ClubsPage';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

// Footer component
function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      padding: 'var(--space-6) 0',
      marginTop: 'auto',
      background: 'var(--bg-primary)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '1.5rem' }}>🐝</span>
          <span style={{ fontWeight: 700, color: 'var(--primary-300)' }}>The Hive</span>
        </div>
        <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '0.875rem' }}>
          © 2025 The Hive. Cuneyt Hocaya Selamlar ISE304 Software Engineering.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>About</a>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Contact</a>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Privacy</a>
        </div>
      </div>
    </footer>
  );
}

export default App;
