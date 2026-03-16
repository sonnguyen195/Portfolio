#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import requests


@dataclass(frozen=True)
class FrameRef:
    page: str
    node_id: str
    name: str


DEFAULT_FILE_KEY = "zKZazivgUVEjrNaJHasfTl"
DEFAULT_TOKEN_PATH = (Path(__file__).resolve().parent / "../../figma-token.json").resolve()
DEFAULT_OUT_DIR = (Path(__file__).resolve().parent / "public/figma/guardianx/frames").resolve()


def _slug(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "frame"


def _load_token(token_path: Path) -> str:
    data = json.loads(token_path.read_text(encoding="utf-8"))
    token = data.get("token")
    if not isinstance(token, str) or not token.strip():
        raise SystemExit(f"Token not found in {token_path}")
    return token.strip()


def _retry_after_seconds(resp: requests.Response, default: float) -> float:
    ra = resp.headers.get("retry-after")
    if not ra:
        return default
    try:
        v = float(ra)
        # Figma sometimes returns retry-after in milliseconds as an integer.
        if v > 10_000:
            v = v / 1000.0
        return max(1.0, min(900.0, v))
    except Exception:
        return default


def _walk_frames(node: dict[str, Any], page: str) -> Iterable[FrameRef]:
    if node.get("type") == "FRAME":
        node_id = node.get("id")
        name = node.get("name")
        if isinstance(node_id, str) and isinstance(name, str):
            yield FrameRef(page=page, node_id=node_id, name=name)
    for child in node.get("children") or []:
        if isinstance(child, dict):
            yield from _walk_frames(child, page)


def list_frames(
    file_key: str,
    token: str,
    depth: int,
) -> list[FrameRef]:
    backoff = 1.0
    last = None
    for _ in range(8):
        resp = requests.get(
            f"https://api.figma.com/v1/files/{file_key}",
            headers={"X-Figma-Token": token},
            params={"depth": depth},
            timeout=120,
        )
        last = resp
        if resp.status_code == 429:
            wait = _retry_after_seconds(resp, backoff)
            time.sleep(wait)
            backoff = min(30.0, backoff * 2.0)
            continue
        if resp.status_code >= 500:
            time.sleep(min(30.0, backoff))
            backoff = min(30.0, backoff * 2.0)
            continue
        break
    resp = last
    if resp is None:
        raise RuntimeError("No response from Figma files endpoint")
    resp.raise_for_status()
    data = resp.json()

    doc = data.get("document") or {}
    pages = doc.get("children") or []

    frames: list[FrameRef] = []
    for p in pages:
        if not isinstance(p, dict):
            continue
        page_name = p.get("name")
        if not isinstance(page_name, str):
            page_name = "(untitled)"
        for child in p.get("children") or []:
            if isinstance(child, dict):
                frames.extend(list(_walk_frames(child, page_name)))
    return frames


def filter_frames(
    frames: list[FrameRef],
    page_keywords: list[str] | None,
    pages_exact: list[str] | None,
    name_regex: str | None,
    skip_name_regex: str | None,
    skip_instance_ids: bool,
) -> list[FrameRef]:
    out: list[FrameRef] = []
    rx = re.compile(name_regex, re.I) if name_regex else None
    skip_rx = re.compile(skip_name_regex, re.I) if skip_name_regex else None
    page_kw = [k.lower() for k in (page_keywords or [])]
    pages_set = set(pages_exact or [])

    for f in frames:
        if skip_instance_ids and f.node_id.startswith("I"):
            continue
        if pages_set and f.page not in pages_set:
            continue
        if page_kw and not any(k in f.page.lower() for k in page_kw):
            continue
        if rx and not rx.search(f.name):
            continue
        if skip_rx and skip_rx.search(f.name):
            continue
        out.append(f)
    return out


def fetch_image_map(
    file_key: str,
    token: str,
    ids: list[str],
    scale: int,
    fmt: str,
) -> dict[str, str]:
    backoff = 1.0
    last = None
    for _ in range(8):
        resp = requests.get(
            f"https://api.figma.com/v1/images/{file_key}",
            headers={"X-Figma-Token": token},
            params={"ids": ",".join(ids), "scale": scale, "format": fmt},
            timeout=120,
        )
        last = resp
        if resp.status_code == 429:
            wait = _retry_after_seconds(resp, backoff)
            time.sleep(wait)
            backoff = min(30.0, backoff * 2.0)
            continue
        if resp.status_code >= 500:
            time.sleep(min(30.0, backoff))
            backoff = min(30.0, backoff * 2.0)
            continue
        break
    resp = last
    if resp is None:
        raise RuntimeError("No response from Figma images endpoint")
    if resp.status_code == 400 and "Render timeout" in (resp.text or ""):
        raise TimeoutError("Render timeout")
    resp.raise_for_status()
    data = resp.json()
    images = data.get("images") or {}
    return {k: v for k, v in images.items() if isinstance(k, str) and isinstance(v, str) and v}


def download(url: str, path: Path) -> None:
    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 128):
                if chunk:
                    f.write(chunk)


def main() -> int:
    ap = argparse.ArgumentParser(description="Pull frame PNGs from a Figma file via REST API.")
    ap.add_argument("--file-key", default=DEFAULT_FILE_KEY)
    ap.add_argument("--token-path", default=str(DEFAULT_TOKEN_PATH))
    ap.add_argument("--depth", type=int, default=4)
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    ap.add_argument("--scale", type=int, default=2)
    ap.add_argument("--format", default="png", choices=["png", "jpg", "svg"])
    ap.add_argument(
        "--frames-json",
        default=None,
        help="Optional path to JSON ({frames:[...]}) or a list of frames; skips fetching /files if provided.",
    )

    ap.add_argument("--page-keyword", action="append", default=[])
    ap.add_argument("--page", action="append", default=[])
    ap.add_argument("--name-regex", default=None)
    ap.add_argument("--skip-name-regex", default=r"^(frame\\s+\\d+|modal\\s+header|modal\\s+body|browser\\s+control|browser\\s+tabs)$")
    ap.add_argument("--include-instances", action="store_true")

    ap.add_argument("--limit", type=int, default=0, help="Limit number of frames to download (0 = no limit).")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--write-manifest", action="store_true")
    args = ap.parse_args()

    token = _load_token(Path(args.token_path))
    if args.frames_json:
        raw = json.loads(Path(args.frames_json).read_text(encoding="utf-8"))
        items = raw.get("frames") if isinstance(raw, dict) else raw
        frames: list[FrameRef] = []
        if isinstance(items, list):
            for it in items:
                if not isinstance(it, dict):
                    continue
                page = it.get("page") if isinstance(it.get("page"), str) else "(unknown)"
                node_id = it.get("node_id") if isinstance(it.get("node_id"), str) else it.get("id")
                name = it.get("name")
                if isinstance(node_id, str) and isinstance(name, str):
                    frames.append(FrameRef(page=page, node_id=node_id, name=name))
        else:
            raise SystemExit("--frames-json must be a list or an object with {frames:[...]}")
    else:
        frames = list_frames(file_key=args.file_key, token=token, depth=args.depth)

    picked = filter_frames(
        frames,
        page_keywords=args.page_keyword or None,
        pages_exact=args.page or None,
        name_regex=args.name_regex,
        skip_name_regex=args.skip_name_regex,
        skip_instance_ids=not args.include_instances,
    )

    if args.limit and args.limit > 0:
        picked = picked[: args.limit]

    print(f"frames_total={len(frames)} picked={len(picked)} out_dir={args.out_dir}")
    if args.dry_run:
        for f in picked[:60]:
            print(f"- {f.page} | {f.node_id} | {f.name}")
        if len(picked) > 60:
            print(f"... ({len(picked) - 60} more)")
        return 0

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    id_to_ref = {f.node_id: f for f in picked}
    ids = list(id_to_ref.keys())

    manifest: dict[str, Any] = {
        "fileKey": args.file_key,
        "scale": args.scale,
        "format": args.format,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(ids),
        "frames": [],
    }

    def fetch_batch_with_split(batch: list[str]) -> dict[str, str]:
        try:
            return fetch_image_map(args.file_key, token, batch, scale=args.scale, fmt=args.format)
        except TimeoutError:
            if len(batch) <= 1:
                print(f"warning: render timeout for single id: {batch[0] if batch else '(empty)'}")
                return {}
            time.sleep(0.6)
            mid = max(1, len(batch) // 2)
            left = fetch_batch_with_split(batch[:mid])
            right = fetch_batch_with_split(batch[mid:])
            left.update(right)
            return left

    batch_size = 10
    batch_no = 0
    for i in range(0, len(ids), batch_size):
        batch_no += 1
        batch = ids[i : i + batch_size]
        img_map = fetch_batch_with_split(batch)
        missing = [x for x in batch if x not in img_map]
        if missing:
            print(f"warning: {len(missing)} ids missing images in batch {batch_no}")

        for node_id, img_url in img_map.items():
            ref = id_to_ref.get(node_id)
            if not ref:
                continue
            safe_name = _slug(ref.name)
            safe_page = _slug(ref.page)
            safe_id = ref.node_id.replace(":", "-")
            filename = f"{safe_page}__{safe_name}__{safe_id}.{args.format}"
            path = out_dir / filename
            if path.exists() and path.stat().st_size > 0:
                continue
            download(img_url, path)
            manifest["frames"].append(
                {
                    "page": ref.page,
                    "name": ref.name,
                    "id": ref.node_id,
                    "file": str(path.relative_to(out_dir.parent.parent.parent)),  # relative to public/
                }
            )

        time.sleep(0.6)

    if args.write_manifest:
        mf_path = out_dir.parent / "manifest.json"
        mf_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"wrote_manifest={mf_path}")

    print("done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

