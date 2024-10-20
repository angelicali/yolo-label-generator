import { Checkbox } from "@mui/material";

export default function VideoFrame({ serverTaskId, frameFilename, isLabeled, updateFrameSelection }) {
    const onCheckboxChange = (event) => {
        updateFrameSelection(frameFilename, event.target.checked);
    };
    const frameDir = isLabeled ? 'labeled-frame' : 'frame';

    return (
        <div style={{ margin: '10px' }}>
            {isLabeled &&
                <div style={{ display: 'block', textAlign: 'right' }}>
                    <Checkbox defaultChecked onChange={onCheckboxChange} />
                </div>
            }
            <img src={`http://localhost:8000/${frameDir}/${serverTaskId}/${frameFilename}`}
                style={{ maxWidth: '300px' }} />

        </div>
    )

};