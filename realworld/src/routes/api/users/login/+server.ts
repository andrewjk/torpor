import { usersLogin } from "@/lib/api/controllers/usersController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	post: ({ request }) => {
		return usersLogin(request);
	},
} satisfies ApiServerEndPoint;
