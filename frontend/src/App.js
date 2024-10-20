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

  // Label frames
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

  // Select labeled frames
  const [frameSelections, setFrameSelections] = useState({});

  const updateFrameSelection = (frameFilename, isChecked) => {
    if (isChecked) {
      setFrameSelections({
        ...frameSelections,
        [frameFilename]: isChecked
      })
    }
  }

  const requestDownload = () => {
    let selectedFrames = [];
    for (const frame of frameFilenames) {
      if (frame in frameSelections && !frameSelections[frame]) {
        continue;
      }
      selectedFrames.push(frame);
    }
    console.log(JSON.stringify(selectedFrames));

    // Make a POST request with the selected frames
    axios.post(`http://localhost:8000/download/${serverTaskId}`, selectedFrames, {
      responseType: 'blob',  // Ensure we handle the binary zip file response
      withCredentials: true,
    })
      .then(response => {
        console.log(response);
        // Create a link to download the zip file
        const contentDisposition = response.headers['content-disposition'];
        let filename = contentDisposition
            ? contentDisposition.split('filename=')[1].replace(/"/g, '')
            : `${serverTaskId}_labels.zip`;

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);  // Clean up the object URL
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

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
          <VideoFrames serverTaskId={serverTaskId} frameFilenames={labeledFrameFilenames} isLabeled updateFrameSelection={updateFrameSelection} />
          <Button variant='contained' onClick={requestDownload}>Download training data</Button>
        </>
      )}
    </div>
  );
};

export default App;
