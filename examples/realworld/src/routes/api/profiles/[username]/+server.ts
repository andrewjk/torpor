import profilesGet from "@/lib/api/controllers/profiles/profilesGet";
import { type ServerEndPoint } from "@torpor/build";

export default {
	get: ({ params, appData }) => {
		return profilesGet(params, appData);
	},
} satisfies ServerEndPoint;
