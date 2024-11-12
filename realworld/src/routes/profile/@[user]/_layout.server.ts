import * as api from "@/lib/api.js";
import type { ServerEndPoint } from "@tera/build";
import { ok } from "@tera/build/response";

export default {
	load: async ({ appData, params }) => {
		const user = appData.user;
		const { profile } = await api.get(`profiles/${params.user}`, user?.token);
		return ok({ profile });
	},
} satisfies ServerEndPoint;
