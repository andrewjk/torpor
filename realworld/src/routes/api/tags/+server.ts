import { getTags } from "@/lib/api/controllers/tagsController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	get: () => {
		return getTags();
	},
} satisfies ApiServerEndPoint;
