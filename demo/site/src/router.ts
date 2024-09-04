import { BaseFileSystemRouter, cleanPath } from "vinxi/fs-router";

export default class FileSystemRouter extends BaseFileSystemRouter {
	toPath(src: string) {
		let routePath = cleanPath(src, this.config)
			.replace(/^\//, "")
			.replace(/index$/, "")
			.replace(/\/$/, "");

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
