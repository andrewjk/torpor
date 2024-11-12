import userGet from "@/lib/api/controllers/user/userGet";
import userUpdate from "@/lib/api/controllers/user/userUpdate";
import type { ApiServerEndPoint } from "@tera/build";

export default {
	get: ({ request }) => {
		return userGet(request);
	},
	post: ({ appData, request }) => {
		return userUpdate(appData, request);
	},
} satisfies ApiServerEndPoint;
