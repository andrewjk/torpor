import * as api from "@/lib/api.js";
import { type ServerEndPoint } from "@tera/kit";
import { redirect, seeOther, unprocessable } from "@tera/kit/response";

export default {
	load: async ({ appData }) => {
		const user = appData.user;
		if (user) {
			return redirect("/");
		}
	},
	actions: {
		default: async ({ cookies, request }) => {
			const data = await request.formData();

			const result = await api.post("users/login", {
				user: {
					email: data.get("email"),
					password: data.get("password"),
				},
			});
			if (result.errors) {
				return unprocessable(result);
			}

			const value = btoa(JSON.stringify(result.user));
			cookies.set("jwt", value, { path: "/" });

			return seeOther("/");
		},
	},
} satisfies ServerEndPoint;
