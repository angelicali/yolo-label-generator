// src/App.js
import React, { useState } from 'react';
// import { Slider } from '@mui/material'; // Optional: Material-UI for styling
import VideoUpload from './components/VideoUpload.js';
import VideoFrames from './components/VideoFrames.js';
import { Button, TextField } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

function App() {
  const [serverTaskId, setServerTaskId] = useState(null);
  const [frameFilenames, setFrameFilenames] = useState([]);
  const [objects, setObjects] = useState("");
  const [labeledFrameFilenames, setLabeledFrameFilenames] = useState([]);
  const [frameSelections, setFrameSelections] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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


  // Select labeled frames
  const updateFrameSelection = (frameFilename, isChecked) => {
    console.log(`updating frame selection. frame selection before update: ${JSON.stringify(frameSelections)}`);
    setFrameSelections(prevSelections => ({
      ...prevSelections,
      [frameFilename]: isChecked
    }));
  }

  // Label frames
  const requestLabeling = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
      console.log("Received labeled frames data:", event.data);
      const data = JSON.parse(event.data);
      updateFrameSelection(data['filename'], data['has_detection']);
      setLabeledFrameFilenames(labeledFrameFilenames => [...labeledFrameFilenames, data['filename']]);
    }
    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    }
  }

  // request Download
  const requestDownload = () => {
    let selectedFrames = [];
    console.log(JSON.stringify(frameSelections));
    for (const frame of frameFilenames) {
      if (frameSelections[frame]) {
        selectedFrames.push(frame);
      }
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

  const reset = () => {
    setServerTaskId(null);
    setFrameSelections({});
    setLabeledFrameFilenames([]);
    setObjects("");
    setFrameFilenames([]);
  }

  const changeObjects = () => {
    setLabeledFrameFilenames([]);
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1>Auto-labeling from video </h1>
      {!serverTaskId && <VideoUpload onServerTaskIdReceipt={onServerTaskIdReceipt} />}
      {(frameFilenames.length > 0 && labeledFrameFilenames.length === 0) && (
        <>
          <VideoFrames serverTaskId={serverTaskId} frameFilenames={frameFilenames} />
          <div style={{ display: 'block', width: '500px' }}>
            <TextField label="Objects to look for" variant="outlined" margin='normal' name='objects' onChange={updateObjects} value={objects} fullWidth />
            <Button variant='contained' onClick={requestLabeling}>Label frames</Button>
          </div>
        </>
      )}
      {labeledFrameFilenames.length > 0 && (
        <>
          <VideoFrames serverTaskId={serverTaskId} frameFilenames={labeledFrameFilenames} isLabeled frameSelections={frameSelections} updateFrameSelection={updateFrameSelection} />
          <Button onClick={changeObjects}>Try a different object</Button>
          <Button variant='contained' onClick={requestDownload}>Download training data</Button>
          <Button onClick={reset}>Process another video</Button>
        </>
      )}
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default App;
