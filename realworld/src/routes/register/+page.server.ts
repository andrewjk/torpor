import * as api from "@/lib/api.js";
import { type ServerEndPoint } from "@tera/kit";
import { redirect, unprocessable } from "@tera/kit/response";

export default {
	load: async ({ cookies }) => {
		// This was coming from parent for some reason?
		// TODO: Move this into hooks/middleware
		const jwt = cookies.get("jwt");
		const user = jwt ? JSON.parse(atob(jwt)) : null;
		if (user) {
			return redirect("/");
		}
	},
	actions: {
		default: async ({ cookies, request }) => {
			const data = await request.formData();

			const user = {
				username: data.get("username"),
				email: data.get("email"),
				password: data.get("password"),
			};

			const result = await api.post("users", { user });
			if (result.errors) {
				return unprocessable(result);
			}

			const value = btoa(JSON.stringify(result.user));
			cookies.set("jwt", value, { path: "/" });

			return redirect("/");
		},
	},
} satisfies ServerEndPoint;
