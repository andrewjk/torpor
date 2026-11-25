/**
 * Parses the `status` query parameter the `/_error` page reads, accepting
 * only a complete 4xx/5xx code. Anything else — missing, non-numeric, out of
 * range, or a 2xx/3xx code — falls back to 404.
 *
 * The query string is user-controlled, so it must not decide the response
 * status unfiltered: `?status=abc` made the response throw, `?status=200`
 * served the error page as a success, and `?status=302` returned a redirect
 * with no `Location`.
 *
 * @param value The raw `status` query value, or null when absent
 * @returns A valid 4xx/5xx status, or 404
 */
export default function parseErrorStatus(value: string | null): number {
	if (value === null || !/^[45]\d{2}$/.test(value)) return 404;
	return Number(value);
}
