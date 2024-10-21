import component from "@/components/Party.tera";
import type { EndPoint } from "@tera/kit";

export default {
	load: () => {
		console.log("data");
	},
	component,
} satisfies EndPoint;
