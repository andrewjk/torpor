import usersRegister from "@/lib/api/controllers/users/usersRegister";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	post: ({ request }) => {
		return usersRegister(request);
	},
} satisfies ApiServerEndPoint;
