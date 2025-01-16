import usersLogin from "@/lib/api/controllers/users/usersLogin";
import type { ServerEndPoint } from "@torpor/build";

export default {
	post: ({ request }) => {
		return usersLogin(request);
	},
} satisfies ServerEndPoint;
