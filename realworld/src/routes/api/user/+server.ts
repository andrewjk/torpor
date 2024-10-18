import { userGet, userUpdate } from "@/lib/api/controllers/userController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	get: ({ request }) => {
		return userGet(request);
	},
	post: ({ appData, request }) => {
		return userUpdate(appData, request);
	},
} satisfies ApiServerEndPoint;
