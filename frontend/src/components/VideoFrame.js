import { Checkbox } from "@mui/material";

export default function VideoFrame({serverTaskId, frameFilename}) {
    return (
        <div style={{ margin: '10px'}}>
            <div style={{display: 'block', textAlign: 'right'}}>
                <Checkbox defaultChecked/>
            </div>
            <img src={`http://localhost:8000/frame/${serverTaskId}/${frameFilename}`}
                style={{maxWidth: '300px'}} />
            
        </div>
    )

};