import { BaseFileSystemRouter, cleanPath } from "vinxi/fs-router";

export default class FileSystemRouter extends BaseFileSystemRouter {
	toPath(src: string) {
		let routePath = cleanPath(src, this.config)
			.replace(/^\//, "")
			.replace(/_hook.server$/, "_hook/~server")
			.replace(/_layout.server$/, "_layout/~server")
			.replace(/\+page.server$/, "~server")
			.replace(/\+page$/, "")
			.replace(/\+server$/, "")
			.replace(/\/$/, "");
		return routePath?.length > 0 ? `/${routePath}` : "/";
	}

	toRoute(filePath: string) {
		return {
			path: this.toPath(filePath),
			$handler: {
				src: filePath,
				pick: ["default"],
			},
		};
	}
}
