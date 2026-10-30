class SEODataPipeline:
    """Collect all scraped SEO items into a results list accessible by the API."""

    def __init__(self):
        self.results = []

    def process_item(self, item, spider):
        self.results.append(dict(item))
        return item
