import React from 'react';
import VideoFrame from './VideoFrame';

export default function VideoFrames({ serverTaskId, frameFilenames, isLabeled = false, frameSelections = {}, updateFrameSelection = null }) {
    console.log(frameSelections);
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '2000px', display: 'flex', justifyContent: 'space-evenly', flexWrap: 'wrap' }}>
                {isLabeled ? (
                    <> 
                        {frameFilenames.map((filename) => (
                            <VideoFrame key={`${filename}-labeled`}
                                serverTaskId={serverTaskId}
                                frameFilename={filename}
                                isLabeled={true}
                                frameSelections={frameSelections}
                                updateFrameSelection={updateFrameSelection}
                            />
                        ))
                    }</>
                ) : (
                    <> 
                        {frameFilenames.map((filename) => (
                            <VideoFrame key={filename}
                                serverTaskId={serverTaskId}
                                frameFilename={filename}
                            />
                        ))
                    }</>
                )}                    
            </div>
        </div>
    );
};