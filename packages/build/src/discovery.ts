/**
 * SEO helpers: `seo()` builds head element data for a page, and
 * `sitemap()` serves a runtime sitemap that can read the database.
 */

export { default as seo } from "./discovery/seo";
export { sitemapResponse } from "./discovery/sitemap";

export type { SeoOptions } from "./discovery/seo";
export type { SitemapOptions } from "./discovery/sitemap";
