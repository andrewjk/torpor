import component from "@/components/Components/Home/Demo.tera";
import { type EndPoint, buildRoutePath } from "@tera/kit";

// TODO: Could be generated
interface RouteParams {
	slug: number;
}

// Could use Zod etc to generate/validate these
interface UrlParams {
	search?: string;
}

// TODO: Can't build the string part of the path dynamically, but could test it automatically?
// Actually we should be able to make a templated string, I think?
export function route(slug: number, params?: UrlParams) {
	return buildRoutePath<RouteParams, UrlParams>("demo/[slug]", { slug }, params);
}

export default {
	load: ({ params }) => {
		return { params };
	},
	component,
} satisfies EndPoint;
