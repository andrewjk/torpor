import Demo from "@/components/Components/Home/Demo.tera";
import { type EndPoint } from "@tera/kit";

//import { route as demoRoute } from "./[slug]";

export default {
	data: () => {
		console.log("data");
	},
	view: () => {
		return {
			component: Demo,
		};
	},
} satisfies EndPoint;
