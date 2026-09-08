const TITLE_REGEX = /<title(?:\s[^>]*)?>[\s\S]*?<\/title>/g;
const FIRST_TITLE_REGEX = /<title(?:\s[^>]*)?>[\s\S]*?<\/title>/;

/**
 * Merges the head string rendered by a page (and its layouts) into the site
 * template. The first <title> in the head string -- the page's, since pages
 * render before the layouts around them -- wins, overriding both any later
 * component title (e.g. from a child component) and a static <title> in the
 * template itself. All other head content (styles, meta elements, etc) is
 * appended where %COMPONENT_HEAD% sits in the template, before </head>.
 */
export default function mergeHead(template: string, head: string): string {
	const titles = head.match(TITLE_REGEX);
	let html = template;
	let headHtml = head;
	if (titles?.length) {
		headHtml = head.replace(TITLE_REGEX, "");
		html = html.replace(FIRST_TITLE_REGEX, "");
		headHtml = titles[0] + headHtml;
	}
	return html.replace("%COMPONENT_HEAD%", headHtml);
}
