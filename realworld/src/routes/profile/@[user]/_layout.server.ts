import * as api from "@/lib/api.js";
import type { ServerEndPoint } from "@tera/kit";
import { ok } from "@tera/kit/response";

export default {
	load: async ({ cookies, params }) => {
		// TODO: Move this into hooks/middleware
		const jwt = cookies.get("jwt");
		const user = jwt ? JSON.parse(atob(jwt)) : null;
		const { profile } = await api.get(`profiles/${params.user}`, user?.token);
		return ok({ profile });
	},
} satisfies ServerEndPoint;
