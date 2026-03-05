import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8rem' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ textAlign: 'center', maxWidth: '800px', padding: '0 2rem' }}>
        <div className="badge-green glass-panel" style={{ display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.85rem', marginBottom: '2rem' }}>
          ✨ Hackathon MVP V1.0 is Live
        </div>
        <h1 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1, margin: '0 0 1.5rem 0', letterSpacing: '-2px' }}>
          Stop cooling <br/><span style={{ color: 'var(--text-muted)' }}>empty rooms.</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          ClimateSense IONET is an AI-powered mesh network of occupancy sensors that intelligently regulates office ceiling fans. Save up to 40% on energy bills.
        </p>
        <Link to="/dashboard" style={{ background: 'var(--accent-green)', color: '#000', padding: '1rem 2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          Launch Live Dashboard
        </Link>
      </motion.div>
    </div>
  );
}