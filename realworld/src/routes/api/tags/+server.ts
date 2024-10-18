import tagsGet from "@/lib/api/controllers/tags/tagsGet";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	get: () => {
		return tagsGet();
	},
} satisfies ApiServerEndPoint;
