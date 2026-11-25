/** Limits on what each page may ship (see `Site.budgets`). */
export default interface Budgets {
	/** The most gzipped JavaScript (in bytes) a page may load before it hydrates. */
	js?: number;
	/** Fail the build when a page goes over, rather than warning. */
	fail?: boolean;
}
