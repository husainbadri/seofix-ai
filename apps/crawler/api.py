"""
ApexSEO Scrapy Crawler API
--------------------------
Exposes Scrapy crawls over HTTP so the Node.js backend can trigger
them asynchronously and poll for results.

Endpoints
---------
POST /crawl          – start a new crawl job
GET  /crawl/<job_id> – get job status + results
GET  /health         – liveness probe
"""

import json
import os
import sys
import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Scrapy in-process runner ──────────────────────────────────────────────────
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("SCRAPY_SETTINGS_MODULE", "scrapy_seo.settings")

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# In-memory job store  {job_id -> JobRecord}
jobs: Dict[str, "JobRecord"] = {}
jobs_lock = threading.Lock()


# ── Job model ─────────────────────────────────────────────────────────────────
@dataclass
class JobRecord:
    job_id: str
    url: str
    max_pages: int
    depth: int
    status: str = "queued"  # queued | running | done | error
    pages: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    summary: Dict[str, Any] = field(default_factory=dict)


# ── Scrapy runner (runs in its own thread) ────────────────────────────────────
def run_scrapy_crawl(job: JobRecord) -> None:
    """Run the SEO spider in a background thread and store results on job."""
    try:
        job.status = "running"
        job.started_at = time.time()

        collected_pages: List[Dict[str, Any]] = []

        # We need a fresh CrawlerProcess per crawl because Twisted reactor
        # cannot be restarted in the same thread.  We spawn a subprocess for
        # each job to work around Twisted's single-reactor limitation cleanly.
        import subprocess
        import tempfile

        output_file = tempfile.NamedTemporaryFile(
            suffix=".json", delete=False, mode="w"
        )
        output_path = output_file.name
        output_file.close()

        crawler_dir = os.path.dirname(os.path.abspath(__file__))
        run_crawl_script = os.path.join(crawler_dir, "run_crawl.py")

        cmd = [
            sys.executable,
            run_crawl_script,
            job.url,
            str(job.max_pages),
            str(job.depth),
            output_path,
        ]

        env = os.environ.copy()
        env["SCRAPY_SETTINGS_MODULE"] = "scrapy_seo.settings"

        proc = subprocess.run(
            cmd,
            cwd=crawler_dir,
            env=env,
            capture_output=True,
            timeout=300,  # 5 minute max
        )

        # Parse results
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                raw = f.read().strip()
                if raw:
                    collected_pages = json.loads(raw)
        except (json.JSONDecodeError, FileNotFoundError):
            collected_pages = []

        # Cleanup temp file
        try:
            os.unlink(output_path)
        except OSError:
            pass

        if proc.returncode != 0 and not collected_pages:
            stderr = proc.stderr.decode("utf-8", errors="ignore")[:500]
            job.status = "error"
            job.error = f"Scrapy exited {proc.returncode}: {stderr}"
        else:
            job.pages = collected_pages
            job.status = "done"
            job.summary = _build_summary(collected_pages)

    except subprocess.TimeoutExpired:
        job.status = "error"
        job.error = "Crawl timed out after 5 minutes"
    except Exception as exc:
        job.status = "error"
        job.error = str(exc)
    finally:
        job.finished_at = time.time()


def _build_summary(pages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute high-level SEO stats from crawled pages."""
    if not pages:
        return {}

    total = len(pages)
    indexable = sum(1 for p in pages if p.get("is_indexable", False))
    missing_title = sum(1 for p in pages if not p.get("title"))
    missing_desc = sum(1 for p in pages if not p.get("meta_description"))
    missing_h1 = sum(1 for p in pages if p.get("h1_count", 0) == 0)
    multiple_h1 = sum(1 for p in pages if p.get("h1_count", 0) > 1)
    has_schema = sum(1 for p in pages if p.get("has_schema_markup", False))
    images_missing_alt = sum(len(p.get("images_missing_alt", [])) for p in pages)
    avg_load_ms = (
        sum(p.get("load_time_ms", 0) for p in pages) // total if total else 0
    )
    status_codes: Dict[int, int] = {}
    for p in pages:
        sc = p.get("status_code", 0)
        status_codes[sc] = status_codes.get(sc, 0) + 1

    return {
        "total_pages": total,
        "indexable_pages": indexable,
        "missing_title": missing_title,
        "missing_meta_description": missing_desc,
        "missing_h1": missing_h1,
        "multiple_h1": multiple_h1,
        "has_schema_markup": has_schema,
        "images_missing_alt": images_missing_alt,
        "avg_load_time_ms": avg_load_ms,
        "status_codes": status_codes,
    }


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "apex-seo-scrapy-worker"})


@app.route("/crawl", methods=["POST"])
def start_crawl():
    body = request.get_json(silent=True) or {}
    url = body.get("url")
    if not url:
        return jsonify({"error": "url is required"}), 400

    max_pages = min(int(body.get("max_pages", 50)), 500)
    depth = min(int(body.get("depth", 2)), 5)

    job_id = str(uuid.uuid4())
    job = JobRecord(job_id=job_id, url=url, max_pages=max_pages, depth=depth)

    with jobs_lock:
        jobs[job_id] = job

    t = threading.Thread(target=run_scrapy_crawl, args=(job,), daemon=True)
    t.start()

    return jsonify({
        "job_id": job_id,
        "status": "queued",
        "url": url,
        "max_pages": max_pages,
        "depth": depth,
    }), 202


@app.route("/crawl/<job_id>", methods=["GET"])
def get_crawl(job_id: str):
    with jobs_lock:
        job = jobs.get(job_id)

    if not job:
        return jsonify({"error": "job not found"}), 404

    response_data: Dict[str, Any] = {
        "job_id": job.job_id,
        "url": job.url,
        "status": job.status,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
    }

    if job.status == "done":
        response_data["summary"] = job.summary
        response_data["pages"] = job.pages
    elif job.status == "error":
        response_data["error"] = job.error

    return jsonify(response_data)


@app.route("/crawl/<job_id>/summary", methods=["GET"])
def get_crawl_summary(job_id: str):
    """Lightweight endpoint – summary only, no full page data."""
    with jobs_lock:
        job = jobs.get(job_id)

    if not job:
        return jsonify({"error": "job not found"}), 404

    return jsonify({
        "job_id": job.job_id,
        "url": job.url,
        "status": job.status,
        "pages_crawled": len(job.pages),
        "summary": job.summary if job.status == "done" else None,
        "error": job.error,
    })


@app.route("/jobs", methods=["GET"])
def list_jobs():
    with jobs_lock:
        job_list = [
            {
                "job_id": j.job_id,
                "url": j.url,
                "status": j.status,
                "pages_crawled": len(j.pages),
                "started_at": j.started_at,
                "finished_at": j.finished_at,
            }
            for j in jobs.values()
        ]
    return jsonify(job_list)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("CRAWLER_PORT", 7001))
    print(f"[ApexSEO Scrapy Worker] Starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
