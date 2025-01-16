import component from "@/components/article/Article.torp";
import type { PageEndPoint } from "@torpor/build";

export default {
	component,
	head: ({ data }) => [{ title: data.article.title }],
} satisfies PageEndPoint;
