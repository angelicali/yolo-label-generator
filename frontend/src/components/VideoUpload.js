import ReactPlayer from 'react-player';
import React, { useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';

export default function VideoUpload({onServerTaskIdReceipt}) {
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
        }

    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        // For testing
        // onServerTaskIdReceipt('d1898619-a59f-4af7-8938-a27bdac7b27c');

        const formData = new FormData();
        formData.append('file', videoFile);
        try {
            const response = await axios.post('http://localhost:8000/process-video', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                // withCredentials: true
            });
            console.log(response.data);
            onServerTaskIdReceipt(response.data.task_id);
        } catch (error) {
            console.error('Error uploading video: ', error);
        }
    }


    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <form onSubmit={handleSubmit}>
                <input name="video" type="file" accept="video/*" onChange={handleFileChange} required />
                {videoUrl && (
                    <>
                        <ReactPlayer url={videoUrl} playing controls />
                        <Button variant="contained" type="submit" sx={{marginTop: 3}}>Upload Video</Button>
                    </>
                )}
            </form>
        </div>
    )
};