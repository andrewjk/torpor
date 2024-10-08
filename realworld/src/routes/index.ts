import component from "@/components/Index.tera";
import { type EndPoint } from "@tera/kit";

export default {
	view: () => {
		return {
			component,
		};
	},
} satisfies EndPoint;
