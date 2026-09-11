/**
 * SEO helpers: `seo()` builds head element data for a page, and
 * `sitemap()` serves a runtime sitemap that can read the database.
 */

export { default as seo } from "./seo/seo";
export { sitemapResponse } from "./seo/sitemap";

export type { SeoOptions } from "./seo/seo";
export type { SitemapOptions } from "./seo/sitemap";
