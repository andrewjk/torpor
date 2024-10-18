import { usersRegister } from "@/lib/api/controllers/usersController";
import type { ApiServerEndPoint } from "@tera/kit";

export default {
	post: ({ request }) => {
		return usersRegister(request);
	},
} satisfies ApiServerEndPoint;
