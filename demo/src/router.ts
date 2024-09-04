import { BaseFileSystemRouter, cleanPath } from "vinxi/fs-router";

export default class FileSystemRouter extends BaseFileSystemRouter {
	toPath(src: string) {
		let routePath = cleanPath(src, this.config)
			.replace(/^\//, "") // remove leading slash
			.replace(/index$/, "") // remove trailing index
			.replace(/\/$/, ""); // remove trailing slash

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
