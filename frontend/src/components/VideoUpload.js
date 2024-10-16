import ReactPlayer from 'react-player';
import React, { useState } from 'react';
import axios from 'axios';

export default function VideoUpload() {
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [serverTaskId, setServerTaskId] = useState(null);
    const [frameFilenames, setFrameFilenames] = useState([]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
        }

    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('file', videoFile);
        try {
            const response = await axios.post('http://localhost:8000/process-video', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true
            });
            console.log(response.data);
            setServerTaskId(response.data.task_id);
            handleSSE(response.data.task_id);
        } catch (error) {
            console.error('Error uploading video: ', error);
        }
    }

    const handleSSE = (taskId) => {
        const eventSource = new EventSource(`http://localhost:8000/stream-frames/${taskId}`);
        eventSource.onmessage = (event) => {
            console.log("Received filename:", event.data);
            setFrameFilenames(frameFilenames => [...frameFilenames, event.data]);
        }

        eventSource.onerror = (error) => {
            console.error("SSE error:", error);
            eventSource.close();
        }
    }

    return (
        <div style={{ display: 'block'}}>
            <form onSubmit={handleSubmit}>
                {/* <form action="http://localhost:8000/upload-video" method="post" enctype="multipart/form-data" > */}
                <input name="video" type="file" accept="video/*" onChange={handleFileChange} required />
                {videoUrl && (
                    <>
                        <ReactPlayer url={videoUrl} playing controls />
                        <button type="submit">Upload Video</button>
                    </>
                )}
            </form>
            {serverTaskId && <p>server task id: {serverTaskId}</p>}
            {frameFilenames && (
                <div className='frame-list' style={{display:'flex', justifyContent: 'space-evenly', alignItems: 'center', flexWrap: 'wrap'}}>
                    {frameFilenames.map(filename => (
                        <img key={filename} src={`http://localhost:8000/frame/${serverTaskId}/${filename}`} style={{maxHeight: '200px', margin: '5px'}} />
                    ))}
                </div>
            )}
        </div>
    )
};