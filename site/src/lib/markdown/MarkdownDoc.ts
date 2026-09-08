import type PostFrontmatter from "./PostFrontmatter.ts";

/**
 * A markdown document, parsed once when the module is loaded: its slug,
 * frontmatter, markdown source and rendered html.
 */
export default interface MarkdownDoc {
	/** The slug, derived from the file name, e.g. "01-v1-release" */
	slug: string;
	/** The parsed frontmatter */
	frontmatter: PostFrontmatter;
	/** The markdown source, minus the frontmatter block */
	content: string;
	/** The allmark-rendered html */
	html: string;
	/** The first paragraph, with markup stripped, for list views and summaries */
	excerpt: string;
}

/**
 * The subset of a document used in list views.
 */
export type PostSummary = Pick<MarkdownDoc, "slug" | "frontmatter" | "excerpt">;
