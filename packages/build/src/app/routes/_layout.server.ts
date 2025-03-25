import { type PageServerEndPoint } from "@torpor/build";

export default {
	load: ({ appData }) => {
		console.log("THIS IS THE SERVER LAYOUT");
	},
} satisfies PageServerEndPoint;
