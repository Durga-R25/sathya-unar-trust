#!/usr/bin/env python3
"""
Robust transcription runner for Gemini (google.genai) — Option A ready.

Features:
- Splits long audio into safe chunks using pydub + ffmpeg
- Uses small default chunks (30s) to avoid upload timeouts
- Uploads chunks either directly via google.genai client (with retries)
  OR to a Google Cloud Storage bucket (if GCS_BUCKET env var is set)
- Builds a JSONL of per-chunk "requests" ready for Batch ingestion
- Attempts to create a batch job if google.genai Client supports it;
  otherwise prints instructions and the paths/URLs to use from Cloud Shell.
- Extensive logging, safe defaults, and environment-driven configuration.

Usage examples:
  GEMINI_API_KEY="sk_..." python3 transcribe_fixed.py /path/to/long_audio.mp3 --chunk-seconds 30

Environment variables:
  GEMINI_API_KEY  (required) - your Gemini API key
  GCS_BUCKET      (optional) - if set, uploaded chunks will go to this bucket
  MAX_RETRIES     (optional) - number of upload retries (default 6)

Notes:
- Ensure ffmpeg/ffprobe are installed and on PATH (pydub needs them)
- Install required packages in a venv:
    pip install google-genai google-generativeai pydub google-cloud-storage tenacity

This file is intended to be drop-in usable and resilient.
"""

import argparse
import json
import logging
import math
import os
import sys
import tempfile
import time
from pathlib import Path

# Third-party imports will be optional and handled carefully
try:
    from pydub import AudioSegment
except Exception:
    print("pydub is required. Install: pip install pydub", file=sys.stderr)
    raise

# Optional: google.genai client
genai_v2 = None
try:
    from google import genai as genai_v2
except Exception:
    genai_v2 = None

# Optional: google-generativeai (legacy)
genai_legacy = None
try:
    import google.generativeai as genai_legacy
except Exception:
    genai_legacy = None

# Optional GCS support
gcs_client = None
try:
    from google.cloud import storage as gcs
    gcs_client = gcs
except Exception:
    gcs_client = None

# Tenacity for retries
try:
    from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
except Exception:
    print("tenacity is required. Install: pip install tenacity", file=sys.stderr)
    raise

# HTTPX exceptions for detection
try:
    import httpx
    from httpx import ReadTimeout
except Exception:
    httpx = None
    class ReadTimeout(Exception):
        pass

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("transcribe_fixed")

# Configuration
DEFAULT_CHUNK_SECONDS = 30
DEFAULT_OVERLAP_SECONDS = 1
DEFAULT_MAX_RETRIES = int(os.getenv("MAX_RETRIES", "6"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GCS_BUCKET = os.getenv("GCS_BUCKET")  # optional

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not set in environment. The script will try to proceed but client init will fail without it.")


def create_genai_client(api_key=None):
    """Create a genai client for the new google.genai SDK if available."""
    if genai_v2:
        # prefer explicit api_key
        key = api_key or GEMINI_API_KEY or os.getenv("API_KEY")
        if not key:
            raise ValueError("No API key provided. Set GEMINI_API_KEY environment variable.")
        try:
            client = genai_v2.Client(api_key=key)
            logger.info("Created google.genai Client")
            return client
        except Exception as e:
            logger.exception("Failed to create google.genai Client: %s", e)
            raise
    elif genai_legacy:
        # legacy SDK config
        key = api_key or GEMINI_API_KEY or os.getenv("API_KEY")
        if not key:
            raise ValueError("No API key provided for legacy genai SDK.")
        genai_legacy.configure(api_key=key)
        logger.info("Configured google.generativeai (legacy)")
        return genai_legacy
    else:
        raise RuntimeError("No genai SDK found (neither google.genai nor google.generativeai).")


def ensure_ffmpeg_available():
    """Check ffmpeg/ffprobe presence and raise helpful error if missing."""
    def which(binname):
        for p in os.getenv("PATH", "").split(os.pathsep):
            path = Path(p) / binname
            if path.exists() and path.is_file():
                return str(path)
        return None

    ffmpeg = which("ffmpeg") or which("ffmpeg.exe")
    ffprobe = which("ffprobe") or which("ffprobe.exe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and/or ffprobe not found on PATH. Install ffmpeg and ensure ffmpeg/ffprobe are available.")
    logger.info("Found ffmpeg: %s, ffprobe: %s", ffmpeg, ffprobe)
    return ffmpeg, ffprobe


def split_audio_into_chunks(input_path: str, chunk_seconds: int, overlap_seconds: int, temp_dir=None):
    """Split audio file into smaller chunks and return list of chunk file paths (wav format).

    Uses pydub which calls ffmpeg under the hood.
    """
    ensure_ffmpeg_available()
    audio = AudioSegment.from_file(input_path)
    total_ms = len(audio)
    chunk_ms = int(chunk_seconds * 1000)
    overlap_ms = int(overlap_seconds * 1000)
    step_ms = max(1, chunk_ms - overlap_ms)

    if temp_dir is None:
        temp_dir = tempfile.mkdtemp(prefix="trans_chunks_")
    else:
        os.makedirs(temp_dir, exist_ok=True)

    chunk_paths = []
    start = 0
    idx = 0
    while start < total_ms:
        end = min(total_ms, start + chunk_ms)
        chunk = audio[start:end]
        out_path = os.path.join(temp_dir, f"chunk_{idx:05d}.wav")
        chunk.export(out_path, format="wav")
        chunk_paths.append(out_path)
        idx += 1
        start += step_ms
    logger.info("Split into %d chunks, saved to %s", len(chunk_paths), temp_dir)
    return chunk_paths


@retry(stop=stop_after_attempt(DEFAULT_MAX_RETRIES), wait=wait_exponential(multiplier=1, min=1, max=60),
       retry=retry_if_exception_type(Exception))
def upload_chunk_with_retries(client, chunk_path, display_name=None, use_gcs=False, bucket_name=None):
    """Upload a single chunk either via genai client or to GCS; returns an upload reference (dict).

    This function is retried by tenacity on any Exception.
    """
    logger.info("Uploading chunk %s (use_gcs=%s)", chunk_path, bool(use_gcs))
    if use_gcs:
        if not gcs_client:
            raise RuntimeError("google-cloud-storage not installed; cannot upload to GCS")
        storage_client = gcs_client.Client()
        bucket = storage_client.bucket(bucket_name)
        blob_name = f"transcribe_chunks/{Path(chunk_path).name}"
        blob = bucket.blob(blob_name)
        blob.upload_from_filename(chunk_path)
        url = f"gs://{bucket_name}/{blob_name}"
        logger.info("Uploaded to GCS: %s", url)
        return {"gcs_uri": url}
    else:
        # upload via genai client.files.upload - signature varies; try common patterns
        if not client:
            raise RuntimeError("genai client not available for direct upload")
        # Try common upload patterns used by google.genai
        with open(chunk_path, "rb") as fd:
            try:
                if hasattr(client, "files") and hasattr(client.files, "upload"):
                    # many SDK versions accept upload(file=fd, filename=..., display_name=...)
                    kwargs = {"file": fd}
                    if display_name:
                        kwargs["display_name"] = display_name
                    res = client.files.upload(**kwargs)
                    logger.info("Uploaded chunk via client.files.upload; got: %s", getattr(res, 'id', str(type(res))))
                    return {"genai_file": res}
                elif hasattr(client, "uploads") and hasattr(client.uploads, "create"):
                    res = client.uploads.create(file=fd)
                    return {"genai_file": res}
                else:
                    raise RuntimeError("Unsupported genai client: no known upload method")
            except Exception as e:
                logger.exception("Direct upload failed: %s", e)
                # re-raise to allow retry
                raise


def build_jsonl_requests(chunk_refs, model_name="models/gemini-2.5-pro"):
    """Build a JSONL list (as strings) with per-chunk request payloads suitable for Batch ingestion.

    The exact format of Batch JSONL varies; this function builds a generic request structure that
    many Batch endpoints accept where each line contains an input source and optional meta.
    """
    jsonl = []
    for ref in chunk_refs:
        if "gcs_uri" in ref:
            source = {"uri": ref["gcs_uri"]}
        elif "genai_file" in ref:
            # some SDKs expose file ids; attempt to extract
            f = ref["genai_file"]
            fid = getattr(f, "name", None) or getattr(f, "id", None) or str(f)
            source = {"file_id": fid}
        else:
            source = {"path": str(ref)}
        req = {"input": {"type": "audio", "source": source}, "config": {"transcription": {"language": "en"}}, "model": model_name}
        jsonl.append(json.dumps(req))
    return jsonl


def save_jsonl(jsonl_lines, out_path):
    with open(out_path, "w", encoding="utf-8") as fh:
        for line in jsonl_lines:
            fh.write(line.strip() + "\n")
    logger.info("Wrote JSONL to %s", out_path)


def try_create_batch_from_client(client, jsonl_path, display_name=None):
    """Attempt to create a Batch job using the genai client if supported. Returns job info or None.

    This function tries several common method names to support different SDK versions.
    """
    if client is None:
        logger.info("No client provided for batch creation")
        return None

    # Many SDKs have client.batch.create or client.batch.create_job or client.batch.jobs.create
    try:
        # read file contents
        with open(jsonl_path, "rb") as fd:
            # Try new-style: client.batch.create(jsonl=fd, display_name=...)
            if hasattr(client, "batch"):
                batch = client.batch
                # prefer batch.create
                if hasattr(batch, "create"):
                    try:
                        logger.info("Calling client.batch.create(...) with file upload")
                        res = batch.create(jsonl=fd, display_name=display_name)
                        logger.info("Batch created: %s", res)
                        return res
                    except Exception as e:
                        logger.debug("client.batch.create failed: %s", e)
                # fallback old style
                if hasattr(batch, "jobs") and hasattr(batch.jobs, "create"):
                    logger.info("Calling client.batch.jobs.create(...)")
                    res = batch.jobs.create(jsonl=fd, display_name=display_name)
                    logger.info("Batch job created: %s", res)
                    return res
        logger.info("Client exists but no compatible batch creation method was found.")
    except Exception as e:
        logger.exception("Failed to create batch via client: %s", e)
    return None


def main():
    parser = argparse.ArgumentParser(description="Robust transcribe runner for Gemini (Option A)")
    parser.add_argument("audio", help="Path to input audio file (mp3/wav/m4a)")
    parser.add_argument("--chunk-seconds", type=int, default=DEFAULT_CHUNK_SECONDS, help="Chunk size in seconds")
    parser.add_argument("--overlap-seconds", type=int, default=DEFAULT_OVERLAP_SECONDS, help="Overlap between chunks in seconds")
    parser.add_argument("--output-jsonl", default="requests.jsonl", help="Output JSONL file with requests")
    parser.add_argument("--batch-display-name", default=None)
    parser.add_argument("--use-gcs", action="store_true", help="Force upload to GCS bucket (GCS_BUCKET env var required)")
    parser.add_argument("--model", default="models/gemini-2.5-pro")
    args = parser.parse_args()

    audio_path = os.path.abspath(args.audio)
    if not os.path.exists(audio_path):
        logger.error("Audio file not found: %s", audio_path)
        sys.exit(2)

    # prepare temp dir
    temp_dir = tempfile.mkdtemp(prefix="transcribe_work_")
    logger.info("Temporary working dir: %s", temp_dir)

    # chunk audio
    try:
        chunks = split_audio_into_chunks(audio_path, args.chunk_seconds, args.overlap_seconds, temp_dir=temp_dir)
    except Exception as e:
        logger.exception("Failed to split audio: %s", e)
        sys.exit(3)

    # decide upload method
    use_gcs = bool(GCS_BUCKET) or args.use_gcs
    if use_gcs and not GCS_BUCKET:
        logger.error("GCS_BUCKET env var must be set when --use-gcs is given")
        sys.exit(4)

    # create client if direct upload is desired
    client = None
    if not use_gcs:
        try:
            client = create_genai_client()
        except Exception as e:
            logger.warning("Could not create genai client for direct upload: %s", e)
            if not GCS_BUCKET:
                logger.error("No alternative upload method available. Set GCS_BUCKET env var or use --use-gcs and ensure google-cloud-storage is installed.")
                sys.exit(5)
            use_gcs = True

    # upload chunks with retries
    chunk_refs = []
    for cp in chunks:
        try:
            ref = upload_chunk_with_retries(client, cp, display_name=Path(cp).name, use_gcs=use_gcs, bucket_name=GCS_BUCKET)
            chunk_refs.append(ref)
        except Exception as e:
            logger.exception("Failed to upload chunk %s after retries: %s", cp, e)
            logger.error("Aborting. Consider re-running with smaller --chunk-seconds or uploading via Cloud Shell/GCS manually.")
            sys.exit(6)

    # build jsonl
    jsonl_lines = build_jsonl_requests(chunk_refs, model_name=args.model)
    save_jsonl(jsonl_lines, args.output_jsonl)

    # try to create batch job via client
    batch_info = None
    if client:
        batch_info = try_create_batch_from_client(client, args.output_jsonl, display_name=args.batch_display_name)

    if batch_info is None:
        logger.info("Batch not created automatically. You can run the batch from Cloud Shell using the JSONL we produced: %s", args.output_jsonl)
        logger.info("If you uploaded chunks to GCS, the JSONL contains gs:// URIs and is ready for Batch ingestion.")
        logger.info("Otherwise, the file references are local chunk paths; upload them to a stable host (Cloud Shell or your laptop) and call the client.batch.create with the JSONL.")
    else:
        logger.info("Batch job created: %s", batch_info)

    logger.info("Done. Outputs: jsonl=%s, chunks_dir=%s", args.output_jsonl, temp_dir)
    print("OUTPUT_JSONL=", args.output_jsonl)


if __name__ == '__main__':
    main()
