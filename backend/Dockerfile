FROM python:3.9-alpine

WORKDIR /app

RUN apk add git ffmpeg gcc musl-dev libffi-dev
# RUN apk add --no-cache git ffmpeg gcc musl-dev libffi-dev

COPY ./requirements.txt .
RUN pip install --upgrade -r requirements.txt
# RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY ./app /app

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
