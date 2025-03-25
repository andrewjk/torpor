import { type PageServerEndPoint } from "@torpor/build";

export default {
	load: async ({ appData }) => {
		console.log("THIS IS THE PAGE SERVER");
	},
} satisfies PageServerEndPoint;
