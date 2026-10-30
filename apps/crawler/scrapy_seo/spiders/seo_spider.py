import json
import re
import time
from urllib.parse import urljoin, urlparse

import scrapy
from scrapy.selector import Selector

from scrapy_seo.items import SEOPageItem


class SEOSpider(scrapy.Spider):
    name = "seo_spider"
    custom_settings = {
        "DEPTH_LIMIT": 3,
    }

    def __init__(self, start_url=None, max_pages=100, depth=2, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_url = start_url or "https://example.com"
        self.max_pages = int(max_pages)
        self.depth_limit = int(depth)
        self.custom_settings["DEPTH_LIMIT"] = self.depth_limit
        self.crawled_urls = set()
        self.pages_crawled = 0

        parsed = urlparse(self.start_url)
        self.allowed_domain = parsed.netloc
        self.base_url = f"{parsed.scheme}://{parsed.netloc}"

        self.start_urls = [self.start_url]

    def start_requests(self):
        yield scrapy.Request(
            self.start_url,
            callback=self.parse,
            meta={"start_time": time.time(), "depth": 0},
            errback=self.errback,
        )

    def errback(self, failure):
        url = failure.request.url
        item = SEOPageItem()
        item["url"] = url
        item["status_code"] = 0
        item["title"] = ""
        item["meta_description"] = ""
        item["h1_tags"] = []
        item["h2_tags"] = []
        item["h3_tags"] = []
        item["h1_count"] = 0
        item["internal_links"] = []
        item["external_links"] = []
        item["internal_links_count"] = 0
        item["external_links_count"] = 0
        item["images"] = []
        item["images_missing_alt"] = []
        item["images_count"] = 0
        item["is_indexable"] = False
        item["has_noindex"] = False
        item["has_nofollow"] = False
        item["has_schema_markup"] = False
        item["has_structured_data"] = False
        item["structured_data_json_ld"] = []
        item["word_count"] = 0
        item["text_content"] = ""
        item["load_time_ms"] = 0
        item["depth"] = failure.request.meta.get("depth", 0)
        yield item

    def parse(self, response):
        if self.pages_crawled >= self.max_pages:
            return

        url = response.url
        if url in self.crawled_urls:
            return

        # Only parse HTML responses
        content_type = response.headers.get("Content-Type", b"").decode("utf-8", errors="ignore").lower()
        if "text/html" not in content_type:
            return

        self.crawled_urls.add(url)
        self.pages_crawled += 1

        start_time = response.meta.get("start_time", time.time())
        load_time_ms = int((time.time() - start_time) * 1000)
        depth = response.meta.get("depth", 0)

        # Create robust Selector from response text or body
        if hasattr(response, "text") and response.text:
            html_text = response.text
        else:
            html_text = response.body.decode("utf-8", errors="ignore")
        sel = Selector(text=html_text)

        item = SEOPageItem()
        item["url"] = url
        item["status_code"] = response.status
        item["load_time_ms"] = load_time_ms
        item["depth"] = depth
        ct_header = response.headers.get("Content-Type", b"")
        if isinstance(ct_header, list):
            ct_header = ct_header[0] if ct_header else b""
        item["content_type"] = ct_header.decode("utf-8", errors="ignore") if isinstance(ct_header, bytes) else str(ct_header)
        item["html_size_bytes"] = len(response.body)

        # ── TITLE ────────────────────────────────────────────────────────
        title = sel.css("title::text").get(default="").strip()
        item["title"] = title
        item["title_length"] = len(title)

        # ── META DESCRIPTION ─────────────────────────────────────────────
        meta_desc = sel.css('meta[name="description"]::attr(content)').get(default="").strip()
        item["meta_description"] = meta_desc
        item["meta_description_length"] = len(meta_desc)

        # ── HEADINGS ─────────────────────────────────────────────────────
        h1s = [h.strip() for h in sel.css("h1::text").getall() if h.strip()]
        h2s = [h.strip() for h in sel.css("h2::text").getall() if h.strip()]
        h3s = [h.strip() for h in sel.css("h3::text").getall() if h.strip()]
        item["h1_tags"] = h1s
        item["h2_tags"] = h2s
        item["h3_tags"] = h3s
        item["h1_count"] = len(h1s)

        # ── CANONICAL ────────────────────────────────────────────────────
        item["canonical_url"] = sel.css('link[rel="canonical"]::attr(href)').get(default="")

        # ── ROBOTS META ──────────────────────────────────────────────────
        robots_meta = sel.css('meta[name="robots"]::attr(content)').get(default="").lower()
        item["robots_meta"] = robots_meta
        item["has_noindex"] = "noindex" in robots_meta
        item["has_nofollow"] = "nofollow" in robots_meta
        item["is_indexable"] = not item["has_noindex"] and response.status == 200

        # ── VIEWPORT / LANG / CHARSET ─────────────────────────────────────
        item["viewport_meta"] = sel.css('meta[name="viewport"]::attr(content)').get(default="")
        item["lang_attribute"] = sel.css("html::attr(lang)").get(default="")
        item["charset"] = sel.css("meta[charset]::attr(charset)").get(default="")

        # ── OPEN GRAPH ────────────────────────────────────────────────────
        item["og_title"] = sel.css('meta[property="og:title"]::attr(content)').get(default="")
        item["og_description"] = sel.css('meta[property="og:description"]::attr(content)').get(default="")
        item["og_image"] = sel.css('meta[property="og:image"]::attr(content)').get(default="")
        item["og_type"] = sel.css('meta[property="og:type"]::attr(content)').get(default="")
        item["twitter_card"] = sel.css('meta[name="twitter:card"]::attr(content)').get(default="")

        # ── HREFLANG ─────────────────────────────────────────────────────
        item["has_hreflang"] = bool(sel.css('link[rel="alternate"][hreflang]').get())

        # ── LINKS ─────────────────────────────────────────────────────────
        internal_links = []
        external_links = []
        all_hrefs = sel.css("a[href]::attr(href)").getall()
        for href in all_hrefs:
            abs_url = response.urljoin(href)
            parsed = urlparse(abs_url)
            if parsed.scheme not in ("http", "https"):
                continue
            if parsed.netloc == self.allowed_domain:
                internal_links.append(abs_url)
            else:
                external_links.append(abs_url)

        item["internal_links"] = list(dict.fromkeys(internal_links))[:200]
        item["external_links"] = list(dict.fromkeys(external_links))[:100]
        item["internal_links_count"] = len(internal_links)
        item["external_links_count"] = len(external_links)

        # ── IMAGES ───────────────────────────────────────────────────────
        images = []
        images_missing_alt = []
        for img in sel.css("img"):
            src = img.attrib.get("src", "")
            alt = img.attrib.get("alt", None)
            abs_src = response.urljoin(src) if src else ""
            images.append({"src": abs_src, "alt": alt or ""})
            if alt is None or alt.strip() == "":
                images_missing_alt.append(abs_src)

        item["images"] = images[:100]
        item["images_missing_alt"] = images_missing_alt[:50]
        item["images_count"] = len(images)

        # ── STRUCTURED DATA ───────────────────────────────────────────────
        json_ld_blocks = []
        for script in sel.css('script[type="application/ld+json"]::text').getall():
            try:
                parsed_ld = json.loads(script.strip())
                json_ld_blocks.append(parsed_ld)
            except (json.JSONDecodeError, ValueError):
                pass
        item["structured_data_json_ld"] = json_ld_blocks
        item["has_structured_data"] = bool(json_ld_blocks)
        item["has_schema_markup"] = bool(json_ld_blocks)

        # ── TEXT CONTENT / WORD COUNT ──────────────────────────────────────
        body_text = " ".join(sel.css("body *::text").getall()).strip()
        # Clean excessive whitespace
        body_text = re.sub(r"\s+", " ", body_text)
        words = [w for w in body_text.split() if w]
        item["word_count"] = len(words)
        item["text_content"] = body_text[:5000]  # First 5000 chars

        # ── DOM NODE COUNT ────────────────────────────────────────────────
        item["dom_node_count"] = len(sel.css("*"))

        # ── RESPONSE HEADERS ──────────────────────────────────────────────
        headers_dict = {}
        for k, v in response.headers.items():
            key = k.decode("utf-8", errors="ignore").lower() if isinstance(k, bytes) else str(k).lower()
            if isinstance(v, list):
                val = ", ".join(x.decode("utf-8", errors="ignore") if isinstance(x, bytes) else str(x) for x in v)
            elif isinstance(v, bytes):
                val = v.decode("utf-8", errors="ignore")
            else:
                val = str(v)
            headers_dict[key] = val
        item["response_headers"] = headers_dict

        yield item


        # ── FOLLOW INTERNAL LINKS ─────────────────────────────────────────
        if depth < self.depth_limit and self.pages_crawled < self.max_pages:
            for link_url in item["internal_links"]:
                if link_url not in self.crawled_urls:
                    yield scrapy.Request(
                        link_url,
                        callback=self.parse,
                        meta={"start_time": time.time(), "depth": depth + 1},
                        errback=self.errback,
                    )
