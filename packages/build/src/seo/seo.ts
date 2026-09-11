import type { HeadElement } from "../types/PageEndPoint";

/**
 * The elements to build head markup from: a page title, a description and
 * (for social media) an image and a canonical URL.
 */
export type SeoOptions = {
	title?: string;
	description?: string;
	image?: string;
	url?: string;
};

/**
 * Builds head element data for a page: a title, a description, and Open
 * Graph / Twitter (property metas) when an image or url is included, e.g.
 *
 * ```ts
 * import { seo } from "@torpor/build/seo";
 *
 * export default {
 * 	component,
 * 	head: (event) => seo({
 * 		title: post.title,
 * 		description: post.excerpt,
 * 		image: post.coverImage,
 * 		url: event.url.href,
 * 	}),
 * } satisfies PageEndPoint;
 * ```
 *
 * The values are rendered into the document head at render time (with
 * `@head` markup from the component around them), overriding any static
 * `<title>` in the site template. A twitter:card is included only when an
 * image is set, with `og:title`/`og:description`/`og:url` set from the
 * other values.
 *
 * @param options The values to include
 * @returns The head element data
 */
export default function seo(options: SeoOptions): HeadElement[] {
	const head: HeadElement[] = [];
	if (options.title !== undefined) {
		head.push({ title: options.title });
		head.push({ property: "og:title", content: options.title });
	}
	if (options.description !== undefined) {
		head.push({ name: "description", content: options.description });
		head.push({ property: "og:description", content: options.description });
	}
	if (options.image !== undefined) {
		head.push({ property: "og:image", content: options.image });
		head.push({ name: "twitter:card", content: "summary_large_image" });
		head.push({ name: "twitter:image", content: options.image });
	}
	if (options.url !== undefined) {
		head.push({ property: "og:url", content: options.url });
	}
	return head;
}
