import component from "@/components/Components/Home/Demo.tera";
import type { EndPoint } from "@tera/kit";

//import { route as demoRoute } from "./[slug]";

export default {
	load: () => {
		console.log("data");
	},
	component,
} satisfies EndPoint;
