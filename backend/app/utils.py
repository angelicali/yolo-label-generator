import cv2
import imagehash
from PIL import Image
from pathlib import Path
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
def label_images(model, image_dir, objects, output_dir=None):
    image_dir = Path(image_dir)
    for filepath in sorted(image_dir.glob('*.jpg')):
        image = cv2.imread(filepath)
        if image is None:
            print(f"cannot read image from {filepath}")
            continue
        results = model(image)[0]
        if output_dir:
            output_img_path = output_dir / filepath.name
            cv2.imwrite(output_img_path, results.plot())
            detections = json.loads(results.to_json())
            print(detections)
            if len(detections) != 0:
                output_txt_path = output_dir / (filepath.stem + '.txt')
                with output_txt_path.open('w') as f:
                    f.write(results_to_label(detections, objects))
            yield filepath.name, len(detections) != 0

# Label conversion
def results_to_label(detections, objects):
    s = []
    for d in detections:
        s.append(detection_label(d, objects))
    return '\n'.join(s)
        
def detection_label(d, objects):
    class_id = objects[d['name']]
    box = d['box']
    centerx, centery, width, height = convert_box(box)
    label = f"{class_id} {centerx} {centery} {width} {height}"
    return label


def convert_box(box):
    img_width = 640
    img_height = 480
    x1, y1, x2, y2 = box['x1'], box['y1'], box['x2'], box['y2']
    centerx = (x1+x2)/2 / img_width 
    centery = (y1+y2)/2 / img_height
    width = (x2-x1) / img_width
    height = (y2-y1) / img_height
    return (centerx, centery, width, height)



# For testing
if __name__ == "__main__":
    # input_video = "./test_files/20241007055556.mp4"
    # output_dir = "./test_files"
    # filter_frames(input_video, output_dir)
    from ultralytics import YOLOWorld

    img_dir = "../../modeling/training_data/"
    model = YOLOWorld("yolov8x-worldv2.pt")
    model.set_classes(["raccoon"])
    for label in label_images(model, img_dir):
        print(label)