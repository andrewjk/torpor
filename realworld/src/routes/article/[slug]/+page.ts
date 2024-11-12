import component from "@/components/article/Article.tera";
import type { EndPoint } from "@tera/build";

export default {
	component,
	head: ({ data }) => [{ title: data.article.title }],
} satisfies EndPoint;
