import type BuildStatus from "../client/BuildStatus";
import type BuildServerStatus from "../server/BuildServerStatus";

/**
 * Makes a supplied variable name (hopefully!) unique by prepending `t_` and
 * appending a sequence number
 *
 * @param name The variable name
 * @param status The build status
 *
 * @returns A unique variable name
 */
export default function nextVarName(name: string, status: BuildStatus | BuildServerStatus): string {
	if (!status.varNames[name]) {
		status.varNames[name] = 1;
	}
	let varName = `t_${name}_${status.varNames[name]}`;
	status.varNames[name] += 1;
	return varName;
}
