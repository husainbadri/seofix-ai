BOT_NAME = "seo_crawler"

SPIDER_MODULES = ["scrapy_seo.spiders"]
NEWSPIDER_MODULE = "scrapy_seo.spiders"

# Crawl responsibly
ROBOTSTXT_OBEY = True
USER_AGENT = "ApexSEO-Bot/2.4 (+https://apexseo.ai/bot)"

# Concurrent settings for production
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 4
DOWNLOAD_DELAY = 0.5

# Timeouts
DOWNLOAD_TIMEOUT = 15

# Respect Crawl-Delay in robots.txt
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 0.5
AUTOTHROTTLE_MAX_DELAY = 5
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0

# HTTP Cache (dev only)
HTTPCACHE_ENABLED = False

# Pipelines
ITEM_PIPELINES = {
    "scrapy_seo.pipelines.SEODataPipeline": 300,
}

# Enable cookies
COOKIES_ENABLED = True

# Depth limit
DEPTH_LIMIT = 3

# Response body max size (10MB)
DOWNLOAD_MAXSIZE = 10485760

# Retry
RETRY_TIMES = 2
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# HTTP compression
COMPRESSION_ENABLED = True

# Default headers
DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
}

# Log level
LOG_LEVEL = "WARNING"

# Feed format (for CLI export)
FEEDS = {}

# Request fingerprinter
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
