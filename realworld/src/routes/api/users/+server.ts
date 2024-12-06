import usersRegister from "@/lib/api/controllers/users/usersRegister";
import type { ServerEndPoint } from "@tera/build";

export default {
	post: ({ request }) => {
		return usersRegister(request);
	},
} satisfies ServerEndPoint;
