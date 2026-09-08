const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

/**
 * Formats an ISO date (e.g. "2026-09-04") as "September 4, 2026". The parts
 * are parsed directly, so there's no timezone shifting.
 */
export default function formatDate(iso: string): string {
	const [year, month, day] = iso.split("-").map(Number);
	return `${MONTHS[month! - 1]} ${day}, ${year}`;
}
