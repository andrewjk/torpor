import { getProfile } from "@/lib/api/controllers/profileController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	post: ({ params, appData }) => {
		return getProfile(params, appData);
	},
} satisfies ApiServerEndPoint;
