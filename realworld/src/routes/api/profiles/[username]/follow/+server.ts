import profilesFollow from "@/lib/api/controllers/profiles/profilesFollow";
import profilesUnFollow from "@/lib/api/controllers/profiles/profilesUnFollow";
import type { ServerEndPoint } from "@torpor/build";

export default {
	post: ({ params, request }) => {
		return profilesFollow(params, request);
	},
	del: ({ params, request }) => {
		return profilesUnFollow(params, request);
	},
} satisfies ServerEndPoint;
