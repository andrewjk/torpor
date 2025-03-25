import { type ServerHook } from "@torpor/build";

export default {
	handle: ({ cookies }) => {
		console.log("THIS IS THE SERVER HOOK");
	},
} satisfies ServerHook;
