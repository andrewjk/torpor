import * as api from "@/lib/api.js";
import type { PageServerEndPoint } from "@torpor/build";
import { ok } from "@torpor/build/response";

export default {
	load: async ({ appData, params }) => {
		const user = appData.user;
		const { profile } = await api.get(`profiles/${params.user}`, user?.token);
		return ok({ profile });
	},
} satisfies PageServerEndPoint;
