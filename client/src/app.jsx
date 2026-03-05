import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

// This automatically connects to the same URL the site is hosted on
const socket = io(window.location.origin);

function App() {
  const [data, setData] = useState(null);
  const [hardware, setHardware] = useState(null);

  useEffect(() => {
    socket.on('ionet_telemetry', (payload) => {
      setData(payload);
    });

    socket.on('hardware_update', (hwPayload) => {
      setHardware(hwPayload);
    });

    return () => socket.off();
  }, []);

  return (
    <div className="App">
      <h1>ClimateSense Dashboard</h1>
      {/* Your existing dashboard UI components here */}
      {hardware && (
        <div className="hardware-alert">
          <h3>Live Hardware Node: {hardware.zone}</h3>
          <p>Temp: {hardware.temperature}°C</p>
        </div>
      )}
    </div>
  );
}

export default App;