import userGet from "@/lib/api/controllers/user/userGet";
import userUpdate from "@/lib/api/controllers/user/userUpdate";
import { type ServerEndPoint } from "@torpor/build";

export default {
	get: ({ request }) => {
		return userGet(request);
	},
	put: ({ appData, request }) => {
		return userUpdate(appData, request);
	},
} satisfies ServerEndPoint;
