import * as api from "@/lib/api.js";
import type { ServerEndPoint } from "@tera/kit";
import { redirect, unauthorized, unprocessable } from "@tera/kit/response";

export default {
	load: ({ cookies }) => {
		// TODO: Move this into hooks/middleware
		const jwt = cookies.get("jwt");
		const user = jwt ? JSON.parse(atob(jwt)) : null;
		if (!user) {
			return redirect("/login");
		}
	},
	actions: {
		logout: ({ cookies }) => {
			cookies.delete("jwt", { path: "/" });
			// TODO: Is this necessary?
			//locals.user = null;
		},
		save: async ({ cookies, request }) => {
			// TODO: Move this into hooks/middleware
			const jwt = cookies.get("jwt");
			const exuser = jwt ? JSON.parse(atob(jwt)) : null;
			if (!exuser) {
				return unauthorized();
			}

			const data = await request.formData();

			const user = {
				username: data.get("username"),
				email: data.get("email"),
				password: data.get("password"),
				image: data.get("image"),
				bio: data.get("bio"),
			};

			const result = await api.put("user", { user }, exuser.token);
			if (result.errors) {
				return unprocessable(result);
			}

			const value = btoa(JSON.stringify(result.user));
			cookies.set("jwt", value, { path: "/" });

			// TODO: Is this necessary?
			//locals.user = body.user;
		},
	},
} satisfies ServerEndPoint;
