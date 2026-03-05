const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const path = require('path');
const { generateNetworkData } = require('./controllers/simulation');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 🚀 HARDWARE & DATA STATE
// ==========================================
let latestHardwareData = null;

// Route for ESP32 to POST data
app.post('/api/hardware', (req, res) => {
    latestHardwareData = req.body; 
    // Broadcast hardware data immediately to frontend via WebSockets
    io.emit('hardware_update', latestHardwareData);
    res.status(200).send({ status: 'success' });
});

// ==========================================
// 📧 AUTOMATED ALERTS (GMAIL)
// ==========================================
// Use Environment Variables for security on Render
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'taufikali7867@gmail.com',
        pass: process.env.GMAIL_PASS || 'pzexwjvvosbplvsu' // Ensure no spaces here
    }
});

cron.schedule('*/1 * * * *', async () => {
    console.log('\n🔄 [AUTOMATION] Generating ESG report...');
    const currentData = generateNetworkData().globalMetrics;
    const reportMessage = `🌱 ClimateSense Alert\nEnergy Saved: ${currentData.lifetimeKwhSaved} kWh\nCO2 Reduced: ${currentData.co2ReducedKg} kg.`;

    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER || 'taufikali7867@gmail.com',
            to: 'taufikali7867@gmail.com',
            subject: '📊 ClimateSense: Monthly ESG Report',
            text: reportMessage
        });
        console.log('✅ Email delivered!');
    } catch (error) {
        console.error('❌ Email Error:', error.message);
    }
});

// ==========================================
// 🌐 SERVING FRONTEND (CRITICAL FOR RENDER)
// ==========================================
// 1. Serve static files from the React "dist" folder
// path.join ensures the path is correct for Render's Linux environment
app.use(express.static(path.join(__dirname, '../client/dist')));

// 2. Initialize WebSockets
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" } 
});

io.on('connection', (socket) => {
    console.log('🔌 Client connected to Socket.io');
    const simulationInterval = setInterval(() => {
        socket.emit('ionet_telemetry', generateNetworkData());
    }, 3000);
    
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected');
        clearInterval(simulationInterval);
    });
});

// 3. Catch-all route to serve the React index.html
// This allows React Router to handle page navigation on the live site
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ==========================================
// 🚀 START SERVER
// ==========================================
// Use Render's dynamic port or default to 5001
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 ClimateSense Server running on port ${PORT}`);
});