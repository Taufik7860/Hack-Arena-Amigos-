const express = require('express');
const router = express.Router();

// Import only the controller functions needed for the API
const { addZone, removeZone } = require('../controllers/simulation');

// 1. Admin Login Route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, token: 'ionet-demo-token-8923' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// 2. Add New Room Route
router.post('/rooms', (req, res) => {
    const { roomName } = req.body;
    if (addZone(roomName)) {
        res.json({ success: true, message: `${roomName} added to mesh.` });
    } else {
        res.status(400).json({ success: false, message: 'Room already exists.' });
    }
});

// 3. Delete Room Route
router.delete('/rooms/:identifier', (req, res) => {
    const identifier = req.params.identifier;
    if (removeZone(identifier)) {
        res.json({ success: true, message: `${identifier.toUpperCase()} permanently disconnected.` });
    } else {
        res.status(404).json({ success: false, message: `Could not find ${identifier} to delete.` });
    }
});

// 4. Monthly Historical Data
router.get('/monthly-savings', (req, res) => {
    const monthlyData = [
        { month: 'Jan', kwhSaved: 850 },
        { month: 'Feb', kwhSaved: 920 },
        { month: 'Mar', kwhSaved: 1100 },
        { month: 'Apr', kwhSaved: 1250 },
        { month: 'May', kwhSaved: 1400 },
        { month: 'Jun', kwhSaved: 1550 },
        { month: 'Jul', kwhSaved: 1700 }, // Summer peak savings
        { month: 'Aug', kwhSaved: 1750 },
        { month: 'Sep', kwhSaved: 1600 },
        { month: 'Oct', kwhSaved: 1300 },
        { month: 'Nov', kwhSaved: 1050 },
        { month: 'Dec', kwhSaved: 950 }
    ];
    res.json({ success: true, data: monthlyData });
});

module.exports = router;