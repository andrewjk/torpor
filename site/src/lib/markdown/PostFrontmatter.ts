/**
 * The frontmatter fields that every markdown document is expected to have.
 */
export default interface PostFrontmatter {
	/** The document title, e.g. "Torpor v1 Release" */
	title: string;
	/** The ISO publish date, e.g. "2026-09-04" */
	publish_date: string;
}
