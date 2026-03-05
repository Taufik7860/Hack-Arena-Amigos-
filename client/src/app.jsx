import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login'; // <--- NEW IMPORT
import './index.css';

const Navbar = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  // Hide navbar on login screen
  if (location.pathname === '/login') return null;

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', padding: '1.5rem 2rem',
      position: isLanding ? 'absolute' : 'static', width: '100%', boxSizing: 'border-box',
      zIndex: 10, background: isLanding ? 'transparent' : 'var(--bg-dark)',
      borderBottom: isLanding ? 'none' : '1px solid var(--card-border)'
    }}>
      <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
        ClimateSense <span style={{ color: 'var(--accent-green)' }}>IONET</span>
      </div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>Product</Link>
        <Link to="/dashboard" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>Live Dashboard</Link>
        <Link to="/admin" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>Admin View</Link>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <Router>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />  {/* <--- NEW ROUTE */}
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}