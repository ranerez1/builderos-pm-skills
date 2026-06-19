#!/usr/bin/env python3
"""Tier A video capture: Gemini-driven step segmentation.

Modeled after the video-ux-review skill's Gemini upload pattern. Sends a video
(local file or platform URL) to Gemini 2.5 Flash with a step-segmentation prompt,
parses the structured response into validation steps, extracts a frame per step
at its timestamp via ffmpeg, and writes flow.json.

Usage:
    python scripts/capture-video.py --video <path-or-url> --feature <slug> --out <dir> [--env staging] [--goal "..."]

Requires:
    - GEMINI_API_KEY (or GOOGLE_API_KEY) env var
    - google-genai (auto-installed into .venv on first run by main.mjs)
    - ffmpeg
    - yt-dlp (only for platform URLs)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse


PROMPT = """\
You are analyzing a screen recording to produce a step-by-step validation playbook.

Break the video into 4 to 12 sequential validation steps. Each step is a meaningful
user action and the resulting UI state — not every micro-click, but every moment
where a tester would want to assert "is this the expected screen and behavior?"

For each step, return a JSON object with these fields:
  - timestamp: float, the moment in seconds where this step's UI is fully shown
  - label: 3-6 word title (e.g. "Open Exports page", "Submit billing form")
  - action: one sentence describing what the user does at this step
  - expected_behavior: one sentence describing what should appear / happen
  - assertions: list of 1-4 short testable conditions (e.g. "Button labeled 'Save' is visible and enabled")

Output ONLY a JSON array, no prose, no markdown fences. Example:

[
  {
    "timestamp": 3.2,
    "label": "Open Exports page",
    "action": "Click 'Exports' in the left nav",
    "expected_behavior": "Exports list loads with a 'New export' button top-right",
    "assertions": ["Page title contains 'Exports'", "'New export' button is visible"]
  }
]
"""


def is_url(s: str) -> bool:
    return urlparse(s).scheme in ("http", "https")


def slugify(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:40] or "step"


def download_video(url: str, dest_dir: Path) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["yt-dlp", "-f", "mp4/best", "-o", str(dest_dir / "source.%(ext)s"), url],
        check=True,
    )
    files = list(dest_dir.glob("source.*"))
    if not files:
        raise RuntimeError("yt-dlp produced no file")
    return files[0]


def extract_frame(video: Path, out_path: Path, seconds: float) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(seconds),
            "-i",
            str(video),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(out_path),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def call_gemini(video_path: Path) -> list[dict]:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) not set")

    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError:
        sys.stderr.write(
            "google-genai package not installed. Run: pip install google-genai\n"
        )
        raise

    client = genai.Client(api_key=api_key)

    # Upload via the File API and poll until ACTIVE.
    uploaded = client.files.upload(file=str(video_path))
    while uploaded.state.name == "PROCESSING":
        time.sleep(2)
        uploaded = client.files.get(name=uploaded.name)
    if uploaded.state.name != "ACTIVE":
        raise RuntimeError(f"Gemini upload failed: state={uploaded.state.name}")

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[uploaded, PROMPT],
        config=genai_types.GenerateContentConfig(response_mime_type="application/json"),
    )

    text = response.text or "[]"
    # Strip any accidental markdown fences just in case.
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text)
    steps = json.loads(text)
    if not isinstance(steps, list):
        raise RuntimeError("Gemini did not return a JSON array")
    return steps


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True)
    parser.add_argument("--feature", required=True)
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument("--env", default="staging")
    parser.add_argument("--goal", default="")
    parser.add_argument("--preconditions", default="", help="Newline-separated")
    args = parser.parse_args()

    out_dir = Path(args.out)
    screenshots_dir = out_dir / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    flow_path = out_dir / "flow.json"

    # Resolve video file.
    if is_url(args.video):
        if not shutil.which("yt-dlp"):
            sys.stderr.write("yt-dlp not found. Install: brew install yt-dlp\n")
            return 3
        tmp = Path("/tmp") / f"validation-video-{os.getpid()}"
        print(f"Downloading {args.video} ...", flush=True)
        video_file = download_video(args.video, tmp)
    else:
        video_file = Path(args.video)
        if not video_file.exists():
            sys.stderr.write(f"Video not found: {video_file}\n")
            return 3

    if not shutil.which("ffmpeg"):
        sys.stderr.write("ffmpeg not found. Install: brew install ffmpeg\n")
        return 3

    print("Uploading to Gemini ...", flush=True)
    steps = call_gemini(video_file)
    print(f"Gemini returned {len(steps)} step(s).", flush=True)

    preconditions = [s.strip() for s in (args.preconditions or "").splitlines() if s.strip()]
    flow = {
        "feature": args.feature,
        "url": None,
        "captured_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "captured_via": "video",
        "preconditions": preconditions,
        "goal": args.goal,
        "env": args.env,
        "steps": [],
    }

    for i, raw in enumerate(steps, start=1):
        label = (raw.get("label") or f"Step {i}").strip()
        padded = f"{i:02d}"
        slug = slugify(label) or f"step-{padded}"
        screenshot_rel = f"screenshots/{padded}-{slug}.png"
        extract_frame(video_file, out_dir / screenshot_rel, float(raw.get("timestamp", 0)))

        flow["steps"].append(
            {
                "id": f"{padded}-{slug}",
                "label": label,
                "action": (raw.get("action") or "").strip(),
                "expected_behavior": (raw.get("expected_behavior") or "").strip(),
                "screenshot": screenshot_rel,
                "assertions": [s.strip() for s in (raw.get("assertions") or []) if s.strip()],
                "notes": "",
            }
        )

    flow_path.write_text(json.dumps(flow, indent=2) + "\n")
    print(f"flow.json: {flow_path}", flush=True)
    print(f"screenshots: {out_dir / 'screenshots'}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
