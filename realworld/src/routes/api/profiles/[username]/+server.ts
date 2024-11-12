import profilesGet from "@/lib/api/controllers/profiles/profilesGet";
import type { ApiServerEndPoint } from "@tera/build";

export default {
	post: ({ params, appData }) => {
		return profilesGet(params, appData);
	},
} satisfies ApiServerEndPoint;
