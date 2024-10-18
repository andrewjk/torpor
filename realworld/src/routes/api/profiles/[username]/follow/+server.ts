import { followProfile, unFollowProfile } from "@/lib/api/controllers/profileController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	post: ({ params, request }) => {
		return followProfile(params, request);
	},
	del: ({ params, request }) => {
		return unFollowProfile(params, request);
	},
} satisfies ApiServerEndPoint;
