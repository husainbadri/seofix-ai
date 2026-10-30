import scrapy


def get_field(sel, css_or_xpath, method="css", attr=None, default=None):
    """Safe helper to extract a field or return default."""
    try:
        if method == "css":
            result = sel.css(css_or_xpath)
        else:
            result = sel.xpath(css_or_xpath)

        if attr:
            value = result.attrib.get(attr, default)
        else:
            value = result.get(default="")

        return value.strip() if value else default
    except Exception:
        return default


class SEOPageItem(scrapy.Item):
    url = scrapy.Field()
    status_code = scrapy.Field()
    load_time_ms = scrapy.Field()
    content_type = scrapy.Field()

    # On-Page SEO
    title = scrapy.Field()
    title_length = scrapy.Field()
    meta_description = scrapy.Field()
    meta_description_length = scrapy.Field()
    h1_tags = scrapy.Field()
    h2_tags = scrapy.Field()
    h3_tags = scrapy.Field()
    h1_count = scrapy.Field()
    canonical_url = scrapy.Field()
    robots_meta = scrapy.Field()
    viewport_meta = scrapy.Field()
    lang_attribute = scrapy.Field()
    charset = scrapy.Field()

    # Links
    internal_links = scrapy.Field()
    external_links = scrapy.Field()
    internal_links_count = scrapy.Field()
    external_links_count = scrapy.Field()

    # Images
    images = scrapy.Field()
    images_missing_alt = scrapy.Field()
    images_count = scrapy.Field()

    # Structured Data
    structured_data_json_ld = scrapy.Field()
    has_structured_data = scrapy.Field()

    # Open Graph / Social
    og_title = scrapy.Field()
    og_description = scrapy.Field()
    og_image = scrapy.Field()
    og_type = scrapy.Field()
    twitter_card = scrapy.Field()

    # Content
    word_count = scrapy.Field()
    text_content = scrapy.Field()

    # Technical
    has_schema_markup = scrapy.Field()
    response_headers = scrapy.Field()
    html_size_bytes = scrapy.Field()
    dom_node_count = scrapy.Field()

    # Flags
    is_indexable = scrapy.Field()
    has_noindex = scrapy.Field()
    has_nofollow = scrapy.Field()
    has_hreflang = scrapy.Field()
    depth = scrapy.Field()
