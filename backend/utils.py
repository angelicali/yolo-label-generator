import cv2
import imagehash
from PIL import Image
import glob
from pathlib import Path
from ultralytics import YOLOWorld
import json

# Frame filtering
def difference_hash(frame, hash_size=6):
    pil_img = Image.fromarray(frame)
    return imagehash.dhash(pil_img, hash_size)


def filter_frames(input_filepath:Path, output_dir:Path):
    cap = cv2.VideoCapture(input_filepath)
    success, frame = cap.read()
    accepted_hashes = set()
    img_idx = 0
    frame_idx = 0

    image_prefix = input_filepath.stem
    while success:
        frame_hash = difference_hash(frame)
        if frame_hash in accepted_hashes:
            print(f"skipping frame {frame_idx} with hash {frame_hash}")
        else:
            accepted_hashes.add(frame_hash)
            image_filepath = output_dir / f"{image_prefix}_{str(img_idx).zfill(4)}.jpg"
            cv2.imwrite(image_filepath, frame)
            yield image_filepath.name
            img_idx += 1
        
        frame_idx += 1
        success, frame = cap.read()

    print("frame filtering completed")
    cap.release()

# Image labeling
def label_images(model, image_dir):
    labels = {}
    image_dir = Path(image_dir)
    for filepath in sorted(image_dir.glob('*.jpg')):
        image_id = filepath.stem
        image = cv2.imread(filepath)
        if image is None:
            print(f"cannot read image from {filepath}")
            continue
        results = model(image)[0]
        labels[image_id] = json.loads(results.to_json())
    return labels

# For testing
if __name__ == "__main__":
    # input_video = "./test_files/20241007055556.mp4"
    # output_dir = "./test_files"
    # filter_frames(input_video, output_dir)
    img_dir = "../../../modeling/training_data/"
    model = YOLOWorld("yolov8x-worldv2.pt")
    model.set_classes(["raccoon"])
    label_images(model, img_dir)