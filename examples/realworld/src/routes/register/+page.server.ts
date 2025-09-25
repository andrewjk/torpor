import * as api from "@/lib/api.js";
import { type PageServerEndPoint } from "@torpor/build";
import { seeOther, temporaryRedirect, unprocessable } from "@torpor/build/response";

export default {
	load: async ({ appData }) => {
		// This was coming from parent for some reason?
		const user = appData.user;
		if (user) {
			return temporaryRedirect("/");
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

			return seeOther("/");
		},
	},
} satisfies PageServerEndPoint;
