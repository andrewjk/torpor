type ParamsType = Record<PropertyKey, any>;

export default function buildRoutePath<RP extends ParamsType, UP extends ParamsType>(
	path: string,
	routeParams: RP,
	urlParams?: UP,
) {
	for (let [key, value] of Object.entries(routeParams)) {
		path = path.replace(`[${key}]`, value);
	}
	if (urlParams) {
		// TODO: More sophisticated url params serialization
		let params = Object.entries(urlParams)
			.map(([key, value]) => {
				if (value != null) {
					return `${key}=${value}`;
				}
			})
			.filter(Boolean);
		if (params.length) {
			path += `?${params.join("&")}`;
		}
	}
	return path;
}
