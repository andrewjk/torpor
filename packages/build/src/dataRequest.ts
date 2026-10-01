/**
 * The request header a client data request sets.
 *
 * A GET to `<page url>/~server` carrying this header is handled specially:
 * the server runs the folder hooks once against the page's url and returns the
 * server data for the page and all of its layouts in a single JSON response
 * (`{ loads: [...] }`). This mirrors the server render, where hooks run once
 * with the page url and every layout and the page load in the same request --
 * fetching each `~server` separately would run hooks with internal paths like
 * `/_layout`.
 *
 * The response's `loads` array lines up with the page's layouts (root to leaf)
 * followed by the page itself, so the client can merge each layout's cached
 * client data with its fresh server data.
 */
export const DATA_REQUEST_HEADER = "X-Torpor-Data";

/**
 * A JSON array of the layout paths a data request is reusing. Reused layouts
 * keep their already-loaded data, so the server skips their loads (their slot
 * in `loads` is `null`), avoiding redundant work and repeated side effects.
 */
export const DATA_REUSE_HEADER = "X-Torpor-Reuse";
