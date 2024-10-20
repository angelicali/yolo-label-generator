// src/App.js
import React, { useState } from 'react';
// import { Slider } from '@mui/material'; // Optional: Material-UI for styling
import VideoUpload from './components/VideoUpload.js';
import VideoFrames from './components/VideoFrames.js';
import { Button, TextField } from '@mui/material';
import axios from 'axios';

function App() {
  const [serverTaskId, setServerTaskId] = useState(null);
  const [frameFilenames, setFrameFilenames] = useState([]);
  const [objects, setObjects] = useState("");
  const [labeledFrameFilenames, setLabeledFrameFilenames] = useState([]);

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

  const updateObjects = (event) => {
    setObjects(event.target.value);
  }

  const requestLabeling = async () => {
    const formData = new FormData();
    formData.append('objects', objects);
    try {
      const response = await axios.post(`http://localhost:8000/request-labeling/${serverTaskId}`, formData, {
      });
      console.log(response.data);
      getLabeledFrames();
    } catch (error) {
      console.error('Error requesting labeling: ', error);
    }
  }

  const getLabeledFrames = () => {
    const eventSource = new EventSource(`http://localhost:8000/stream-labeled-frames/${serverTaskId}`);
    eventSource.onmessage = (event) => {
      console.log("Received labeled frames:", event.data);
      setLabeledFrameFilenames(labeledFrameFilenames => [...labeledFrameFilenames, event.data]);
    }
    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1>Auto-labeling from video </h1>
      {!serverTaskId && <VideoUpload onServerTaskIdReceipt={onServerTaskIdReceipt} />}
      {(frameFilenames.length > 0 && labeledFrameFilenames.length == 0) && (
        <>
          <VideoFrames serverTaskId={serverTaskId} frameFilenames={frameFilenames} />
          <div style={{ display: 'block', width: '500px' }}>
            <TextField label="Objects to look for" variant="outlined" margin='normal' onChange={updateObjects} fullWidth />
            <Button variant='contained' onClick={requestLabeling}>Label frames</Button>
          </div>
        </>
      )}
      {labeledFrameFilenames.length > 0 && (
        <>
          <VideoFrames serverTaskId={serverTaskId} frameFilenames={labeledFrameFilenames} isLabeled/>
        </>
      )}
    </div>
  );
};

export default App;
