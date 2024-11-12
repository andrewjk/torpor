import tagsGet from "@/lib/api/controllers/tags/tagsGet";
import type { ApiServerEndPoint } from "@tera/build";

export default {
	get: () => {
		return tagsGet();
	},
} satisfies ApiServerEndPoint;
