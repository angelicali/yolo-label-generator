import React from 'react';
import VideoFrame from './VideoFrame';

export default function VideoFrames({ serverTaskId, frameFilenames }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '2000px', display: 'flex', justifyContent: 'space-evenly', flexWrap: 'wrap' }}>
                {
                    frameFilenames.map(filename => (
                        <VideoFrame key={filename} serverTaskId={serverTaskId} frameFilename={filename} />
                    ))
                }
            </div>
        </div>
    );
};