import type { ServerHook } from "@tera/kit";

export default {
	handle: ({ appData, cookies }) => {
		const jwt = cookies.get("jwt");
		appData.user = jwt ? JSON.parse(atob(jwt)) : null;
	},
} satisfies ServerHook;
