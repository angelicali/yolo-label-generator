import React, { useState } from 'react';
import VideoFrame from './VideoFrame';

export default function VideoFrames({ serverTaskId, frameFilenames, isLabeled=false }) {
    // const [frameSelections, setFrameSelections] = useState({});

    // const updateFrameSelection = (frameFilename, isChecked) => {
    //     if (isChecked) {
    //         setFrameSelections({
    //             ...frameSelections,
    //             [frameFilename]: isChecked
    //         })
    //     }
    // }

    // const requestLabeling = () => {
        // let selectedFrames = [];
        // for (const frame of frameFilenames) {
        //     if (frame in frameSelections && !frameSelections[frame]) {
        //         continue;
        //     }
        //     selectedFrames.push(frame);
        // }
        // console.log(JSON.stringify(selectedFrames));

        // const formData = new FormData();
        // formData.append('frames', selectedFrames);
    // };

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '2000px', display: 'flex', justifyContent: 'space-evenly', flexWrap: 'wrap' }}>
                {
                    frameFilenames.map(filename => (
                        <VideoFrame key={filename}
                            serverTaskId={serverTaskId}
                            frameFilename={filename} 
                            isLabeled={isLabeled}
                            />
                    ))
                }
            </div>
        </div>
    );
};