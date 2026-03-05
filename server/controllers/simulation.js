const nodemailer = require('nodemailer');

// Set up the email bot 
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'taufikali7867@gmail.com',
        pass: 'pzexwjvvosbplvsu'
    }
});

let zones = ['Engineering', 'Marketing', 'Sales', 'Conference A'];
let totalHistoricalKwhSaved = 1245.5; 
let alertSentForRoom = {}; 

function addZone(zoneName) {
    if (!zones.includes(zoneName) && zoneName.trim() !== "") {
        zones.push(zoneName);
        return true;
    }
    return false;
}

// BULLETPROOF DELETE: Handles both "Marketing" AND "ROOM-2"
function removeZone(identifier) {
    // 1. Try to delete by exact Location Name first
    const indexByName = zones.findIndex(z => z.toLowerCase() === identifier.toLowerCase());
    if (indexByName !== -1) {
        zones.splice(indexByName, 1);
        return true;
    }

    // 2. Try to delete by Room ID (e.g. "ROOM-2")
    const cleanId = identifier.replace(/\s+/g, '').toLowerCase();
    const match = cleanId.match(/^room-(\d+)$/);
    if (match) {
        const indexById = parseInt(match[1]) - 1;
        if (indexById >= 0 && indexById < zones.length) {
            zones.splice(indexById, 1);
            return true;
        }
    }
    return false;
}

function optimizeFan(temp, occupancy) {
    if (occupancy === 0) return { speed: 0, status: 'Standby', energySaved: 100 };
    let speedCalc = ((temp - 20) * 0.4) + (occupancy * 0.15);
    let speed = Math.max(1, Math.min(5, Math.ceil(speedCalc)));
    return { speed, status: 'Optimizing', energySaved: 100 - (speed * 20) };
}

function generateNetworkData() {
    let currentTotalSavings = 0;
    let currentTotalCo2 = 0;

    const nodes = zones.map((zone, index) => {
        const temp = (Math.random() * (28 - 22) + 22).toFixed(1);
        const occupancy = Math.floor(Math.random() * 20);
        const aiDecision = optimizeFan(temp, occupancy);
        const currentTemp = parseFloat(temp);

        if (currentTemp > 27.5 && !alertSentForRoom[zone]) {
            console.log(`⚠️ CRITICAL: ${zone} is overheating at ${currentTemp}°C!`);
            alertSentForRoom[zone] = true;
        } else if (currentTemp <= 27.0) {
            alertSentForRoom[zone] = false;
        }

        currentTotalSavings += aiDecision.energySaved;
        currentTotalCo2 += (aiDecision.energySaved * 0.05);

        return {
            id: `room-${index + 1}`,
            zone,
            temperature: currentTemp,
            occupancy,
            fanSpeed: aiDecision.speed,
            status: aiDecision.status,
            energySavedPercent: aiDecision.energySaved
        };
    });

    totalHistoricalKwhSaved += (currentTotalSavings / zones.length) * 0.001; 

    return {
        timestamp: new Date().toISOString(),
        globalMetrics: {
            avgEnergySaved: Math.floor(currentTotalSavings / zones.length) || 0,
            co2ReducedKg: currentTotalCo2.toFixed(2),
            lifetimeKwhSaved: totalHistoricalKwhSaved.toFixed(2)
        },
        nodes
    };
}

module.exports = { generateNetworkData, addZone, removeZone };