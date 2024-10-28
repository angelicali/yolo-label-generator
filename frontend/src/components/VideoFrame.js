import { Checkbox } from "@mui/material";

export default function VideoFrame({ serverTaskId, frameFilename, isLabeled = false, frameSelections = {}, updateFrameSelection = null }) {
    const frameDir = isLabeled ? 'labeled-frame' : 'frame';
    const checked = isLabeled ? frameSelections[frameFilename] : false;
    const onCheckboxChange = (event) => {
        console.log(`checkbox change ${frameFilename}`);
        updateFrameSelection(frameFilename, event.target.checked);
    };
    return (
        <div style={{ margin: '10px' }}>
            {isLabeled &&
                <div style={{ display: 'block', textAlign: 'right' }}>
                    <Checkbox checked={checked} onChange={onCheckboxChange}
                    inputProps={{ 'aria-label': 'controlled' }} 
                    />
                </div>
            }
            <img src={`http://localhost:8000/${frameDir}/${serverTaskId}/${frameFilename}`}
                style={{ maxWidth: '300px' }} />

        </div>
    )

};