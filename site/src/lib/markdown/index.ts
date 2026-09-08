import { extended, htmlRenderers, parse, render } from "allmark";
import parseFrontmatter from "./frontmatter.ts";
import type MarkdownDoc from "./MarkdownDoc.ts";
import type PostFrontmatter from "./PostFrontmatter.ts";
import type { PostSummary } from "./MarkdownDoc.ts";

// The markdown files are read at build time and bundled into the app -- the
// production target is Cloudflare, where there is no file system at runtime
const files = import.meta.glob<string>("../../content/blog/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
});

const posts = new Map<string, MarkdownDoc>();
for (let [file, src] of Object.entries(files)) {
	const slug = file.split("/").pop()!.replace(/\.md$/, "");
	posts.set(slug, createDoc(slug, src));
}

/**
 * Gets a blog post by its slug, e.g. "01-v1-release".
 */
export function getPost(slug: string): MarkdownDoc | undefined {
	return posts.get(slug);
}

/**
 * Lists blog post summaries, newest first.
 */
export function listPosts(): PostSummary[] {
	return [...posts.values()]
		.map((post) => ({ slug: post.slug, frontmatter: post.frontmatter, excerpt: post.excerpt }))
		.sort((a, b) => b.frontmatter.publish_date.localeCompare(a.frontmatter.publish_date));
}

function createDoc(slug: string, src: string): MarkdownDoc {
	const doc = parse(src, extended);
	const html = render(doc, htmlRenderers);
	const content = doc.info ? src.slice(src.indexOf(doc.info) + doc.info.length).trim() : src;
	return {
		slug,
		frontmatter: frontmatterOf(doc.info, slug),
		content,
		html,
		// The excerpt comes from the source, not the html: allmark currently
		// splits the first paragraph after frontmatter at its line breaks
		excerpt: excerptOf(content),
	};
}

function frontmatterOf(info: string | undefined, slug: string): PostFrontmatter {
	const fm = parseFrontmatter(info ?? "");
	if (!fm.title) {
		throw new Error(`Missing "title" in the frontmatter for blog post "${slug}"`);
	}
	if (!fm.publish_date) {
		throw new Error(`Missing "publish_date" in the frontmatter for blog post "${slug}"`);
	}
	return { title: fm.title, publish_date: fm.publish_date };
}

function excerptOf(content: string): string {
	const block = content.split(/\r?\n\r?\n/)[0] ?? "";
	return block
		.replace(/`([^`]*)`/g, "$1")
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[*_~]+([^*_~]*)[*_~]+/g, "$1")
		.replace(/<[^>]*>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}
