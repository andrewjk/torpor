export default function prepareTemplate(template: string, clientScript: string): string {
	let result = template;

	// Put %COMPONENT_HEAD% before </head>
	// This is where styles will go
	let headStart = result.indexOf("</head>");
	if (headStart === -1) {
		throw new Error(`Couldn't find <head> end tag`);
	}
	result = result.substring(0, headStart) + "%COMPONENT_HEAD%" + result.substring(headStart);

	// Put %COMPONENT_BODY% inside <div id="app"></div>
	// This is where the component's HTML will go
	let bodyStart = regexIndexOf(result, /\<div\s+id=("app"|'app'|app)\s+/);
	bodyStart = result.indexOf(">", bodyStart) + 1;
	let bodyEnd = result.indexOf("</div>", bodyStart);
	if (bodyStart === -1 || bodyEnd === -1) {
		throw new Error(`Couldn't find <div id="app"></div>`);
	}
	result = result.substring(0, bodyStart) + "%COMPONENT_BODY%" + result.substring(bodyEnd);

	// Add the clientEntry script at the very end, for hydrating and navigating
	result += `<script type="module" src="${clientScript}"></script>`;

	return result;
}

// From https://stackoverflow.com/a/274094
function regexIndexOf(string: string, regex: RegExp, position?: number) {
	var indexOf = string.substring(position || 0).search(regex);
	return indexOf >= 0 ? indexOf + (position || 0) : indexOf;
}
