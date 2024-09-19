import component from "@/components/Components/Home/AccordionTest.tera";
import { type EndPoint } from "@tera/kit";

export default {
	data: () => {
		console.log("data");
	},
	view: () => {
		return {
			component,
		};
	},
} satisfies EndPoint;
