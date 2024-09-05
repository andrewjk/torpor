import Demo from "@/components/Components/Home/Demo.tera";
import buildRoutePath from "../../../site/src/buildRoutePath";
import EndPoint from "../../../site/src/types/EndPoint";

// TODO: Could be generated
interface RouteParams {
	slug: number;
}

// Could use Zod etc to generate/validate these
interface UrlParams {
	search?: string;
}

// TODO: Can't build the string part of the path dynamically, but could test it automatically?
export function route(slug: number, search?: string) {
	return buildRoutePath<RouteParams, UrlParams>("demo/[slug]", { slug }, { search });
}

export default {
	data: () => {
		console.log("data");
	},
	view: (request) => {
		return {
			component: Demo,
			data: request.urlParams,
		};
	},
} satisfies EndPoint<RouteParams, UrlParams>;
