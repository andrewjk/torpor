import devContext from "./devContext";

export default function popDevBoundary(): void {
	devContext.depth--;
}
