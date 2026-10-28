const ANCHOR_COMMENT = "<!>";
const HYDRATION_START_COMMENT = "<![>";
const HYDRATION_END_COMMENT = "<!]>";
const HYDRATION_BREAK_COMMENT = "<!^>";

/**
 * The branch-break comment for a control statement's branch, with the branch
 * index baked in (`<!^2>`). The server renderer knows which branch it
 * rendered; hydration reads the index back from the marker to detect a
 * branch the client picks differently (see render/hydrationMarkers and
 * render/branchIndex).
 */
function hydrationBranchComment(index: number): string {
	return `<!^${index}>`;
}

export {
	ANCHOR_COMMENT,
	HYDRATION_START_COMMENT,
	HYDRATION_END_COMMENT,
	HYDRATION_BREAK_COMMENT,
	hydrationBranchComment,
};
