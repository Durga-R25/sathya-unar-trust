# Audio Transcription with Gemini API

A robust Python script for transcribing audio files using Google's Gemini API. The script handles long audio files by splitting them into manageable chunks and processing them using batch transcription.

## Features

- Splits long audio files into smaller chunks to avoid upload timeouts
- Supports multiple audio formats (MP3, WAV, M4A, etc.)
- Uses retry logic for reliable uploads
- Supports both direct API uploads and Google Cloud Storage (GCS) bucket uploads
- Generates JSONL files for batch processing
- Extensive logging and error handling

## Prerequisites

- Python 3.7 or higher
- ffmpeg and ffprobe installed and available in PATH
- Google Gemini API key

### Installing ffmpeg

**Windows:**
- Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- Add ffmpeg to your system PATH

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd Transcription
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. Install required packages:
```bash
pip install -r requirements.txt
```

4. Set up your environment variables:
```bash
# Required
export GEMINI_API_KEY="your-api-key-here"

# Optional - for GCS bucket uploads
export GCS_BUCKET="your-bucket-name"
export MAX_RETRIES="6"
```

## Usage

Basic usage:
```bash
python transcribe.py /path/to/audio.mp3
```

With custom chunk size:
```bash
python transcribe.py /path/to/audio.mp3 --chunk-seconds 30
```

Using Google Cloud Storage:
```bash
python transcribe.py /path/to/audio.mp3 --use-gcs
```

### Command-line Arguments

- `audio` - Path to input audio file (required)
- `--chunk-seconds` - Chunk size in seconds (default: 30)
- `--overlap-seconds` - Overlap between chunks in seconds (default: 1)
- `--output-jsonl` - Output JSONL file path (default: requests.jsonl)
- `--batch-display-name` - Display name for the batch job
- `--use-gcs` - Force upload to GCS bucket
- `--model` - Model to use (default: models/gemini-2.5-pro)

## How It Works

1. The script splits your audio file into smaller chunks using pydub
2. Each chunk is uploaded either directly via the Gemini API or to a GCS bucket
3. A JSONL file is generated containing all the chunk references
4. The script attempts to create a batch transcription job
5. Results can be retrieved once the batch job completes

## Environment Variables

- `GEMINI_API_KEY` (required) - Your Gemini API key
- `GCS_BUCKET` (optional) - GCS bucket name for chunk uploads
- `MAX_RETRIES` (optional) - Number of upload retries (default: 6)

## Troubleshooting

**"ffmpeg not found"**: Ensure ffmpeg and ffprobe are installed and in your PATH

**Upload timeouts**: Try reducing the `--chunk-seconds` parameter to create smaller chunks

**API key errors**: Verify your GEMINI_API_KEY environment variable is set correctly

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
