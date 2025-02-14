/**
 * Creates a redirect response with the supplied status code.
 */
export default function transfer(
	status: 300 | 301 | 302 | 303 | 304 | 307 | 308,
	location: string,
): Response {
	return new Response(null, {
		status,
		headers: {
			location,
		},
	});
}
