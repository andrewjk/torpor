import tagsGet from "@/lib/api/controllers/tags/tagsGet";
import type { ServerEndPoint } from "@tera/build";

export default {
	get: () => {
		return tagsGet();
	},
} satisfies ServerEndPoint;
