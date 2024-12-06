import component from "@/components/article/Article.tera";
import type { PageEndPoint } from "@tera/build";

export default {
	component,
	head: ({ data }) => [{ title: data.article.title }],
} satisfies PageEndPoint;
