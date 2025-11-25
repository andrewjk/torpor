import { type PageNumber } from "./PaginationTypes";

/**
 * Builds the pages that should be displayed for pagination.
 *
 * @param count The total number of pages (or items if the page size is greater than 1)
 * @param number The active page number
 * @param pageSize The number of items on each page
 * @param maxPages The maximum number of pages to display (gaps will be indicated with ellipses)
 */
export default function buildPages(
	count: number,
	number: number,
	pageSize: number = 1,
	maxPages: number = 9,
): PageNumber[] {
	// Calculate the page count
	const pageCount = Math.ceil(count / pageSize);

	if (pageCount <= maxPages) {
		// There"s no need for ellipses, just return the numbers
		return Array.from({ length: pageCount })
			.fill(0)
			.map((_, i) => i + 1);
	} else {
		// Get the start and end around the current page number
		// Use floor and ceil in case there is an even number of pages (e.g. if
		// maxPages is 8, there will be 3 numbers at the start and 4 at the end)
		let start = number - Math.floor((maxPages - 1) / 2);
		let end = number + Math.ceil((maxPages - 1) / 2);
		if (start < 1) {
			end += Math.abs(start) + 1;
			start = 1;
		} else if (end > pageCount) {
			start -= end - pageCount;
			end = pageCount;
		}

		// Build the numbers
		const numbers: PageNumber[] = Array.from({ length: end - start + 1 })
			.fill(0)
			.map((_, i) => start + i);

		// Replace numbers at the start and end with ellipses if necessary
		if (numbers[0] !== 1) {
			numbers[0] = 1;
			numbers[1] = "startgap";
		}
		const l = numbers.length;
		if (numbers[l - 1] !== pageCount) {
			numbers[l - 1] = pageCount;
			numbers[l - 2] = "endgap";
		}

		return numbers;
	}
}
