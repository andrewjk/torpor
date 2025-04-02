export default function prepareTemplate(template: string, clientScript: string) {
	let contentStart = regexIndexOf(template, /\<div\s+id=("app"|'app'|app)\s+/);
	contentStart = template.indexOf(">", contentStart) + 1;
	let contentEnd = template.indexOf("</div>", contentStart);
	if (contentStart === -1 || contentEnd === -1) {
		throw new Error(`Couldn't find <div id="app"></div>`);
	}
	return (
		template.substring(0, contentStart) +
		"%COMPONENT_HTML%" +
		template.substring(contentEnd) +
		`<script type="module" src="${clientScript}"></script>`
	);
}

// From https://stackoverflow.com/a/274094
function regexIndexOf(string: string, regex: RegExp, position?: number) {
	var indexOf = string.substring(position || 0).search(regex);
	return indexOf >= 0 ? indexOf + (position || 0) : indexOf;
}
