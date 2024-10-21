import component from "@/components/Index.tera";
import type { EndPoint } from "@tera/kit";

export default {
	load: () => {
		console.log("data");
	},
	component,
} satisfies EndPoint;
