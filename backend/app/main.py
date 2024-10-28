from typing import Annotated, List

from fastapi import FastAPI, File, UploadFile, Cookie, Depends, Response, HTTPException, BackgroundTasks, Form
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import uuid
# import app.utils as utils
import utils
import asyncio
from ultralytics import YOLOWorld
import json
import zipfile
import io
# import redis

app = FastAPI()

# redis_client = redis.Redis(decode_responses=True) # The same as:  redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
task_objects = {}

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

DATA_DIR  = Path("data")
UPLOAD_DIR = "uploads"
FRAME_DIR = "frames"
LABELED_FRAME_DIR = "labeled_frames"
# /data/{task_id}
#           /uploads/{videoname_as_uploaded}
#           /frames/...
#           /labeled_frames/...

STATUS_STARTED = "started"
STATUS_COMPLETED = "completed"

Path.mkdir(DATA_DIR, exist_ok=True)

# def get_session_id(session_id: str=Cookie(None), response: Response= None):
#     if session_id is None:
#         session_id = str(uuid.uuid4())
#         response.set_cookie(key="session_id", value=session_id)
#     return session_id
    
# def extract_frames(task_id, video_path, frames_dir):
    # redis_client.hset(f"task:{task_id}", "status", STATUS_STARTED)
    # frame_filenames = utils.filter_frames(video_path, frames_dir)
    # redis_client.fset(f"task:{task_id}", "output_filenames", frame_filenames)
    # redis_client.hset(f"task:{task_id}", "status", STATUS_COMPLETED)

@app.post("/process-video")
async def process_video(file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    task_dir = DATA_DIR / task_id

    # Store uploaded video
    video_dir = task_dir / UPLOAD_DIR
    video_dir.mkdir(parents=True)
    video_path = video_dir / file.filename
    with video_path.open('wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    print(f"video file saved at {video_path}")
    # redis_client.hset(f"task:{task_id}", "videoname", file.filename)

    # Get frames from video
    # frames_dir = task_dir / FRAME_DIR
    # frames_dir.mkdir()
    # background_tasks.add_task(extract_frames, video_path, frames_dir)
    return {
            "task_id": task_id,
        }

def _get_videopath(task_id):
    video_dir = DATA_DIR / task_id / UPLOAD_DIR
    return next(video_dir.iterdir())

def _get_videoid(task_id):
    videopath = _get_videopath(task_id)
    print(videopath.stem)
    return videopath.stem
async def process_frames(input_filepath, output_dir):
    for filename in utils.filter_frames(input_filepath, output_dir):
        yield f"data: {filename}\n\n"
        await asyncio.sleep(0.1)

async def get_processed_frames(frames_dir):
    for filepath in frames_dir.iterdir():
        yield f"data: {filepath.name}\n\n"

@app.get("/stream-frames/{task_id}")
async def stream_frames(task_id: str):
    task_dir = DATA_DIR / task_id
    frames_dir = task_dir / FRAME_DIR
    if frames_dir.exists():
        return StreamingResponse(get_processed_frames(frames_dir), media_type="text/event-stream")
    else:
        frames_dir.mkdir()
        return StreamingResponse(process_frames(_get_videopath(task_id), frames_dir), media_type="text/event-stream")

@app.get("/frame/{task_id}/{frame_filename}")
async def get_frame(task_id: str, frame_filename: str):
    frame_path = DATA_DIR / task_id / FRAME_DIR / frame_filename
    if not frame_path.exists():
        raise HTTPException(status_code=404, detail="Item not found")
    
    return FileResponse(frame_path)

@app.get("/labeled-frame/{task_id}/{frame_filename}")
async def get_labeled_frame(task_id: str, frame_filename: str):
    frame_path = DATA_DIR / task_id / LABELED_FRAME_DIR / frame_filename
    if not frame_path.exists():
        print(f"file not found at {frame_path}")
        raise HTTPException(status_code=404, detail="Item not found")
    
    return FileResponse(frame_path)

@app.post("/request-labeling/{task_id}")
async def request_labeling(task_id: str, objects: Annotated[str, Form(...)]):
    objects = json.loads(objects)
    task_objects[task_id] = objects
    return {'objects': objects}

async def label_frames(model, img_dir, objects, output_dir):
    for filename, has_detection in utils.label_images(model, img_dir, objects, output_dir):
        data = {
            "filename": filename,
            "has_detection": has_detection
        }
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(0.1)

@app.get("/stream-labeled-frames/{task_id}")
async def stream_labeled_frames(task_id: str):
    model = YOLOWorld("model/yolov8x-worldv2.pt")
    model.set_classes(list(task_objects[task_id].keys()))
    img_dir = DATA_DIR / task_id / FRAME_DIR
    output_dir = DATA_DIR / task_id / LABELED_FRAME_DIR
    output_dir.mkdir(exist_ok=True)
    return StreamingResponse(label_frames(model, img_dir, task_objects[task_id], output_dir), media_type="text/event-stream")
    

@app.post("/download/{task_id}")
async def download(task_id: str, frames: List[str]):
    # Create an in-memory file-like object
    zip_buffer = io.BytesIO()

    # Create a ZIP file in memory
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        for frame in frames:
            frame = Path(frame)
            img_path = DATA_DIR / task_id / FRAME_DIR / frame
            label_path = DATA_DIR / task_id / LABELED_FRAME_DIR / (frame.stem + '.txt')
            if not img_path.exists():
                print(f"WARNING: img path does not exist: {img_path}")
                continue

            zip_file.write(str(img_path), arcname=f'images/{frame}')
            if label_path.exists():
                zip_file.write(str(label_path), arcname=f'labels/{label_path.name}')
            

    # Set the buffer's position to the beginning
    zip_buffer.seek(0)

    # Return the zip file with Content-Disposition to keep the original filename
    headers = {
        'Content-Disposition': f'attachment; filename="{_get_videoid(task_id)}_labels.zip"',
        'Access-Control-Expose-Headers': 'Content-Disposition'
    }

    return Response(content=zip_buffer.getvalue(), media_type="application/zip", headers=headers)

# @app.post("/label-frame/{task_id}")
# async def label_frames(objects: Annotated[str, Form(...)], frames: ):
#     print(form)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


