import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:5001');

export default function Admin() {
  const [networkData, setNetworkData] = useState(null);
  const [newRoom, setNewRoom] = useState(''); 
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
const [monthlyData, setMonthlyData] = useState([
  { month: 'Jan', kwhSaved: 850 },
  { month: 'Feb', kwhSaved: 920 },
  { month: 'Mar', kwhSaved: 1100 },
  { month: 'Apr', kwhSaved: 1250 },
  { month: 'May', kwhSaved: 1400 },
  { month: 'Jun', kwhSaved: 1550 },
  { month: 'Jul', kwhSaved: 1700 },
  { month: 'Aug', kwhSaved: 1750 },
  { month: 'Sep', kwhSaved: 1600 },
  { month: 'Oct', kwhSaved: 1300 },
  { month: 'Nov', kwhSaved: 1050 },
  { month: 'Dec', kwhSaved: 950 }
]);
  const [selectedMonth, setSelectedMonth] = useState('All');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    socket.on('ionet_telemetry', (data) => setNetworkData(data));
    return () => socket.off('ionet_telemetry');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoom) return;
    try {
      const res = await axios.post('http://localhost:5001/api/rooms', { roomName: newRoom });
      setMessage({ type: 'success', text: res.data.message });
      setNewRoom('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error adding room' });
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteRoom = async () => {
    if (!newRoom) {
      setMessage({ type: 'error', text: 'Please enter a Room ID (e.g., ROOM-2) to delete.' });
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    try {
      const res = await axios.delete(`http://localhost:5001/api/rooms/${encodeURIComponent(newRoom)}`);
      setMessage({ type: 'success', text: res.data.message });
      setNewRoom('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error deleting room' });
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const downloadESGReport = () => {
    const reportElement = document.getElementById('esg-report-panel');
    reportElement.style.background = '#09090b';
    reportElement.style.padding = '2rem';
    
    html2canvas(reportElement, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ClimateSense_ESG_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
      
      reportElement.style.background = 'transparent';
      reportElement.style.padding = '0';
    });
  };

  const downloadMonthlyCSV = () => {
    if (!monthlyData || monthlyData.length === 0) return;

    let dataToExport = monthlyData;
    if (selectedMonth !== 'All') {
      dataToExport = monthlyData.filter(row => row.month === selectedMonth);
    }

    let csvContent = "Month,Energy Saved (kWh),Money Saved (INR)\n";

    dataToExport.forEach(row => {
      const rupeesSaved = (row.kwhSaved * 8.5).toFixed(2);
      csvContent += `${row.month},${row.kwhSaved},${rupeesSaved}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const fileNameMonth = selectedMonth === 'All' ? 'All_Months' : selectedMonth;
    link.setAttribute("href", url);
    link.setAttribute("download", `ClimateSense_${fileNameMonth}_Data.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!networkData) return <div style={{textAlign: 'center', marginTop: '20vh'}}>Authenticating & Connecting...</div>;

  const sortedNodes = [...networkData.nodes].sort((a, b) => b.energySavedPercent - a.energySavedPercent);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{margin: 0}}>Admin Control Center</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Manage mesh topology and generate compliance reports.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={downloadESGReport} style={{ background: 'var(--accent-green)', color: 'black', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}>
            📄 Download ESG Report
          </button>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
            Logout Securely
          </button>
        </div>
      </header>

      <div id="esg-report-panel">
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Manage Room Topology</h3>
            
            <form onSubmit={handleAddRoom} style={{ display: 'flex', gap: '0.75rem' }}>
              <input 
                type="text" placeholder="Deploy: 'IT Dept' | Delete: 'ROOM-2'" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} required
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--card-border)', color: 'white' }}
              />
              <button type="submit" style={{ background: 'var(--accent-green)', color: 'black', padding: '0 1rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                Deploy
              </button>
              <button type="button" onClick={handleDeleteRoom} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Delete
              </button>
            </form>
            
            {message && <p style={{ color: message.type === 'success' ? 'var(--accent-green)' : '#ef4444', fontSize: '0.9rem', marginTop: '1rem', marginBottom: 0 }}>{message.text}</p>}
          </div>

          <div className="glass-panel badge-green" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-green)' }}>Sustainability Report</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Lifetime Energy Saved</p>
                <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', color: 'white' }}>{networkData.globalMetrics.lifetimeKwhSaved} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>kWh</span></h1>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>CO2 Prevented</p>
                <h2 style={{ margin: '0.5rem 0 0 0', color: 'white' }}>{networkData.globalMetrics.co2ReducedKg} kg</h2>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Active Room Topology</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {networkData.nodes.map((node) => (
                <motion.div key={node.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '12px' }}>
                  
                  {/* Clean header restored - no individual delete buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <strong>{node.id.toUpperCase()}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)' }}>ONLINE</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location: {node.zone}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>🏆 Efficiency Leaderboard</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>Most energy-efficient zones.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sortedNodes.slice(0, 3).map((node, index) => (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: index === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '8px', border: index === 0 ? '1px solid var(--accent-green)' : '1px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>{node.zone}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Optimum State</span>
                    </div>
                  </div>
                  <strong style={{ color: index === 0 ? 'var(--accent-green)' : 'white' }}>{node.energySavedPercent}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ marginTop: 0 }}>Monthly Energy Savings (kWh)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem', margin: 0 }}>
                Historical performance over the last 6 months.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ 
                  background: 'rgba(0,0,0,0.5)', border: '1px solid var(--card-border)', 
                  color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
                  outline: 'none', fontFamily: 'inherit'
                }}
              >
                <option value="All">All</option>
                {monthlyData.map((data) => (
                  <option key={data.month} value={data.month}>{data.month}</option>
                ))}
              </select>

              <button 
                onClick={downloadMonthlyCSV} 
                style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export CSV Data
              </button>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="kwhSaved" fill="var(--accent-green)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div> 
    </div>
  );
}