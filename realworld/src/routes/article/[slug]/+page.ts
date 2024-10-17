import component from "@/components/article/Article.tera";
import type { EndPoint } from "@tera/kit";

export default {
	component,
	head: ({ data }) => [{ title: data.article.title }],
} satisfies EndPoint;
