import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:5001');

// Electricity cost constant for Pune/Maharashtra commercial rate (Approx ₹8.5/kWh)
const KWH_COST_INR = 8.5; 

export default function Dashboard() {
  const [networkData, setNetworkData] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    socket.on('ionet_telemetry', (data) => {
      setNetworkData(data);
      setChartData(prev => [...prev, { time: new Date().toLocaleTimeString(), savings: data.globalMetrics.avgEnergySaved }].slice(-10));
    });
    return () => socket.off('ionet_telemetry');
  }, []);

  if (!networkData) return <div style={{textAlign: 'center', marginTop: '20vh'}}>Connecting to Sensor Mesh...</div>;

  // Feature 1: Financial ROI Calculation
  const totalSavedINR = (parseFloat(networkData.globalMetrics.lifetimeKwhSaved) * KWH_COST_INR).toFixed(2);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
        <h2>Live Factory Telemetry</h2>
        <div className="glass-panel badge-green" style={{ padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 'bold' }}>
          🟢 AI Optimization Active
        </div>
      </header>

      {/* TOP ROW: Global Metrics & ROI Engine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent-green)' }}>
          <h3 style={{ color: 'var(--text-muted)', marginTop: 0, fontSize: '1rem' }}>Total Financial Savings</h3>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: 'var(--text-main)' }}>₹{totalSavedINR}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-green)' }}>Based on ₹8.5/kWh commercial rate</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', marginTop: 0, fontSize: '1rem' }}>Global Energy Saved</h3>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: 'var(--accent-green)' }}>{networkData.globalMetrics.avgEnergySaved}%</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', marginTop: 0, fontSize: '1rem' }}>CO2 Reduced</h3>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{networkData.globalMetrics.co2ReducedKg} <span style={{fontSize: '1.2rem', color:'var(--text-muted)'}}>kg</span></h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Feature 2: Digital Twin Floorplan */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
            Live Digital Twin 
            <span style={{fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)'}}>Top-down floorplan view</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            {networkData.nodes.map((node) => {
              // Logic for visual alerts: Green if occupied, Red outline if too hot (> 27C)
              const isOccupied = node.occupancy > 0;
              const isHot = node.temperature > 27;
              
              return (
                <motion.div 
                  key={node.id} layout 
                  style={{ 
                    height: '140px',
                    padding: '1rem', 
                    background: isOccupied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', 
                    borderRadius: '12px', 
                    border: isHot ? '2px solid #ef4444' : `1px solid ${isOccupied ? 'var(--accent-green)' : 'var(--card-border)'}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: isHot ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{node.zone}</strong>
                    {isHot && <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem', animation: 'pulse 2s infinite' }}>⚠️ HIGH TEMP</span>}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <div>🌡️ {node.temperature}°C</div>
                      <div>👥 {node.occupancy > 0 ? `${node.occupancy} Active` : 'Empty'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isOccupied ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        Fan: {node.fanSpeed}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Existing Savings Trend Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Network Savings Trend</h3>
          <div style={{ height: '350px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333' }} />
                <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}