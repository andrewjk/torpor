import tagsGet from "@/lib/api/controllers/tags/tagsGet";
import type { ServerEndPoint } from "@torpor/build";

export default {
	get: () => {
		return tagsGet();
	},
} satisfies ServerEndPoint;
