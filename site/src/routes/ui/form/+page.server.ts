import { type PageServerEndPoint } from "@torpor/build";
import { badRequest, ok } from "@torpor/build/response";

export default {
	actions: {
		default: async ({ request }) => {
			const data = await request.formData();
			if (data.has("enabled")) {
				const enabled = data.get("enabled");
				if (enabled === "on" || enabled === "true") {
					return ok({ ok: true });
				}
				return badRequest({ ok: false, message: "toggle is off" });
			}
			const text = data.get("text");
			if (text === "ok") {
				return ok({ ok: true });
			} else {
				return badRequest({ ok: false, message: "bad text", text });
			}
		},
	},
} satisfies PageServerEndPoint;
