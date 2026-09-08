import { ok } from "@torpor/build/response";
import { type PageServerEndPoint } from "@torpor/build";
import { listPosts } from "@/lib/markdown/index";

export default {
	load: () => {
		return ok({ posts: listPosts() });
	},
} satisfies PageServerEndPoint;
