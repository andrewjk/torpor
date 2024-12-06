import profilesGet from "@/lib/api/controllers/profiles/profilesGet";
import type { ServerEndPoint } from "@tera/build";

export default {
	post: ({ params, appData }) => {
		return profilesGet(params, appData);
	},
} satisfies ServerEndPoint;
