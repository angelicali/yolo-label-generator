// src/App.js
import React, { useState } from 'react';
// import { Slider } from '@mui/material'; // Optional: Material-UI for styling
import VideoUpload from './components/VideoUpload.js';

function App() {

  return (
    <div style={{ textAlign: 'center', padding: '20px'}}>
      <h1>Auto-labeling from video </h1>
      <VideoUpload />
    </div>
  );
};

export default App;
