import usersLogin from "@/lib/api/controllers/users/usersLogin";
import type { ApiServerEndPoint } from "@tera/build";

export default {
	post: ({ request }) => {
		return usersLogin(request);
	},
} satisfies ApiServerEndPoint;
