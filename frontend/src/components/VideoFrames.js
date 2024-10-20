import React, { useState } from 'react';
import VideoFrame from './VideoFrame';

export default function VideoFrames({ serverTaskId, frameFilenames, isLabeled = false, updateFrameSelection = null }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '2000px', display: 'flex', justifyContent: 'space-evenly', flexWrap: 'wrap' }}>
                {
                    frameFilenames.map(filename => (
                        <VideoFrame key={filename}
                            serverTaskId={serverTaskId}
                            frameFilename={filename}
                            isLabeled={isLabeled}
                            updateFrameSelection={updateFrameSelection}
                        />
                    ))
                }
            </div>
        </div>
    );
};