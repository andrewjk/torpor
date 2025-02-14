import usersRegister from "@/lib/api/controllers/users/usersRegister";
import { type ServerEndPoint } from "@torpor/build";

export default {
	post: ({ request }) => {
		return usersRegister(request);
	},
} satisfies ServerEndPoint;
