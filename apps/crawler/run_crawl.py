"""
run_crawl.py – standalone Scrapy crawl runner called by api.py as subprocess.

Usage:
    python3 run_crawl.py <url> <max_pages> <depth> <output_json_path>

Exit 0 on success, 1 on error.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

os.environ.setdefault("SCRAPY_SETTINGS_MODULE", "scrapy_seo.settings")

from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from scrapy_seo.spiders.seo_spider import SEOSpider

if len(sys.argv) != 5:
    print("Usage: run_crawl.py <url> <max_pages> <depth> <output_path>", file=sys.stderr)
    sys.exit(1)

url = sys.argv[1]
max_pages = int(sys.argv[2])
depth = int(sys.argv[3])
output_path = sys.argv[4]

# Use Scrapy's built-in JSON feed export, then read it back
settings = get_project_settings()
settings.setdict({
    "LOG_ENABLED": False,
    "FEEDS": {
        output_path: {
            "format": "json",
            "encoding": "utf8",
            "overwrite": True,
        }
    },
    # Disable custom pipelines – use built-in feed export instead
    "ITEM_PIPELINES": {},
    # Disable robots.txt for SEO auditing purposes
    "ROBOTSTXT_OBEY": False,
})

process = CrawlerProcess(settings)
process.crawl(SEOSpider, start_url=url, max_pages=max_pages, depth=depth)
process.start()  # blocks until crawl is complete

sys.exit(0)
