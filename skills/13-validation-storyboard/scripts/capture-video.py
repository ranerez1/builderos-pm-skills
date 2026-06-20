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


def fetch_captions_for_url(url: str, dest_dir: Path) -> Path | None:
    """Best-effort: try to fetch English captions for a platform URL.
    Returns the .vtt path or None if no captions available."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    before = set(dest_dir.iterdir()) if dest_dir.exists() else set()
    try:
        subprocess.run(
            [
                "yt-dlp",
                "--write-subs",
                "--write-auto-subs",
                "--sub-format",
                "vtt",
                "--sub-langs",
                "en.*,en-orig",
                "--skip-download",
                "-o",
                str(dest_dir / "captions.%(ext)s"),
                url,
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return None
    new = [p for p in dest_dir.iterdir() if p.suffix.lower() == ".vtt" and p not in before]
    return new[0] if new else None


def find_sidecar_captions(video_path: Path) -> Path | None:
    base = video_path.with_suffix("")
    for ext in (".vtt", ".srt", ".VTT", ".SRT"):
        candidate = base.with_suffix(ext)
        if candidate.exists():
            return candidate
    return None


def parse_vtt(path: Path) -> list[dict]:
    """Minimal VTT/SRT parser. Returns [{'start': float, 'end': float, 'text': str}]."""
    if not path or not path.exists():
        return []
    raw = path.read_text(encoding="utf-8", errors="replace").replace("\r", "")
    lines = raw.split("\n")
    cues: list[dict] = []
    ts_re = re.compile(
        r"(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}:)?(\d{1,2}):(\d{2})[.,](\d{1,3})"
    )
    i = 0
    while i < len(lines):
        m = ts_re.search(lines[i])
        if m:
            start = _ts_to_seconds(m.group(1), m.group(2), m.group(3), m.group(4))
            end = _ts_to_seconds(m.group(5), m.group(6), m.group(7), m.group(8))
            text_lines = []
            i += 1
            while i < len(lines) and lines[i].strip() != "":
                text_lines.append(_strip_vtt_inline(lines[i]))
                i += 1
            text = re.sub(r"\s+", " ", " ".join(text_lines)).strip()
            if text:
                cues.append({"start": start, "end": end, "text": text})
        i += 1
    return cues


def _ts_to_seconds(hh: str | None, mm: str, ss: str, ms: str) -> float:
    h = int(hh.replace(":", "")) if hh else 0
    return h * 3600 + int(mm) * 60 + int(ss) + int((ms or "0").ljust(3, "0")[:3]) / 1000


def _strip_vtt_inline(line: str) -> str:
    line = re.sub(r"<\d{1,2}:\d{2}:\d{2}\.\d{3}>", "", line)
    line = re.sub(r"</?[cv][^>]*>", "", line)
    return line.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").strip()


def format_cues_for_prompt(cues: list[dict], max_chars: int = 12000) -> str:
    lines = [f'[{c["start"]:.1f}–{c["end"]:.1f}] "{c["text"]}"' for c in cues]
    out = "\n".join(lines)
    if len(out) > max_chars:
        out = out[:max_chars] + "\n…(transcript truncated for length)…"
    return out


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


def call_gemini(video_path: Path, transcript: str = "") -> list[dict]:
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

    prompt = PROMPT
    if transcript:
        prompt = (
            PROMPT
            + "\n\nTRANSCRIPT (timestamps in seconds — use this to ground the step labels in what the speaker says, not just what's visible):\n"
            + transcript
        )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[uploaded, prompt],
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

    # Best-effort transcript fetch.
    transcript_str = ""
    captions_path: Path | None = None
    if is_url(args.video):
        captions_path = fetch_captions_for_url(args.video, Path("/tmp") / f"validation-captions-{os.getpid()}")
    else:
        captions_path = find_sidecar_captions(video_file)
    if captions_path:
        cues = parse_vtt(captions_path)
        if cues:
            transcript_str = format_cues_for_prompt(cues)
            print(f"Transcript: {len(cues)} cue(s) loaded from {captions_path.name}", flush=True)

    print("Uploading to Gemini ...", flush=True)
    steps = call_gemini(video_file, transcript=transcript_str)
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
