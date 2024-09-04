import path from "path";
import url from "url";

export default function dirName() {
	// HACK: Hope this works when published
	//return "../../demo";
	return path.dirname(url.fileURLToPath(import.meta.url));
}
