import { BaseFileSystemRouter, cleanPath } from "vinxi/fs-router";

export default class FileSystemRouter extends BaseFileSystemRouter {
	toPath(src: string) {
		let routePath = cleanPath(src, this.config);
		if (routePath.startsWith("/")) {
			routePath = routePath.substring(1);
		}
		routePath = routePath.replace(/index$/, "");
		if (routePath.endsWith("/")) {
			routePath = routePath.substring(0, routePath.length - 1);
		}

		return routePath?.length > 0 ? `/${routePath}` : "/";
	}

	toRoute(filePath: string) {
		return {
			path: this.toPath(filePath),
			$handler: {
				src: filePath,
				pick: ["view", "data"],
			},
		};
	}
}
