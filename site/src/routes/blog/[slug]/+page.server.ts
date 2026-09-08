import { notFound, ok } from "@torpor/build/response";
import { type PageServerEndPoint } from "@torpor/build";
import { getPost } from "@/lib/markdown/index";
import type MarkdownDoc from "@/lib/markdown/MarkdownDoc";

export default {
	load: ({ params }) => {
		const post = getPost(params.slug);
		if (!post) {
			return notFound();
		}
		return ok({ post });
	},
} satisfies PageServerEndPoint<"/blog/[slug]", { post: MarkdownDoc }>;
