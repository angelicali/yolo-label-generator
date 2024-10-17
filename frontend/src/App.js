// src/App.js
import React, { useState } from 'react';
// import { Slider } from '@mui/material'; // Optional: Material-UI for styling
import VideoUpload from './components/VideoUpload.js';
import VideoFrames from './components/VideoFrames.js';

function App() {
  const [serverTaskId, setServerTaskId] = useState(null);
  const [frameFilenames, setFrameFilenames] = useState([]);

  const getFrames = (taskId) => {
    const eventSource = new EventSource(`http://localhost:8000/stream-frames/${taskId}`);
    eventSource.onmessage = (event) => {
        console.log("Received filename:", event.data);
        setFrameFilenames(frameFilenames => [...frameFilenames, event.data]);
    }

    eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        eventSource.close();
    }
  };

  const onServerTaskIdReceipt = (taskId) => {
    setServerTaskId(taskId);
    getFrames(taskId);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px'}}>
      <h1>Auto-labeling from video </h1>
      {!serverTaskId && <VideoUpload onServerTaskIdReceipt={onServerTaskIdReceipt} />}
      {frameFilenames && <VideoFrames serverTaskId={serverTaskId} frameFilenames={frameFilenames} />}
    </div>
  );
};

export default App;
