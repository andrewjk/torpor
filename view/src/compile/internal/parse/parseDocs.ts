import type Documentation from "../../types/docs/Documentation";
import type PropDocumentation from "../../types/docs/PropDocumentation";
import type SlotDocumentation from "../../types/docs/SlotDocumentation";
import type ParseStatus from "./ParseStatus";
import { accept, addError, consumeSpace, consumeUntil, consumeWord } from "./parseUtils";

export default function parseDocs(status: ParseStatus): Documentation {
	const docs: Documentation = {
		description: "",
		props: [],
		slots: [],
	};

	while (accept("*", status)) {
		consumeSpace(status);
		if (accept("/", status)) {
			// It is the end of the comments
			break;
		} else if (accept("@", status)) {
			const key = consumeWord(status);
			switch (key) {
				case "prop": {
					const prop = parseDocsProp(status);
					docs.props.push(prop);
					break;
				}
				case "slot": {
					const slot = parseDocsSlot(status);
					docs.slots.push(slot);
					break;
				}
				default: {
					addError(status, `Unknown keyword: ${key}`, status.i - key.length - 1);
					break;
				}
			}
		} else if (status.i === status.source.length - 1) {
			addError(status, "Unclosed doc comments", status.i);
			break;
		} else {
			docs.description += consumeUntil("\n*@", status).trim();
			consumeSpace(status);
		}
	}

	return docs;
}

function parseDocsProp(status: ParseStatus): PropDocumentation {
	const docs: PropDocumentation = {
		name: "",
		type: "",
		description: "",
	};

	// Parse the type
	consumeSpace(status);
	if (accept("{", status)) {
		docs.type = consumeUntil("}", status).trim();
		accept("}", status);
		consumeSpace(status);
	}

	// Parse the name
	docs.name = consumeWord(status);
	consumeSpace(status);

	// Maybe parse the description
	if (!accept("*", status, false)) {
		// Ignore leading dashes
		while (accept("-", status)) {}
		docs.description = consumeUntil("\n", status).trim();
		consumeSpace(status);
	}

	while (accept("*", status)) {
		const start = status.i - 1;
		consumeSpace(status);
		if (accept("*", status)) {
			// It was an empty line; move on to the next
			status.i -= 1;
			continue;
		} else if (accept("/", status) || accept("@", status)) {
			// It's the end of the comments or this prop
			status.i = start;
			break;
		} else {
			// Ignore leading dashes
			while (accept("-", status)) {}
			docs.description += consumeUntil("\n", status).trim();
			consumeSpace(status);
		}
	}

	return docs;
}

function parseDocsSlot(status: ParseStatus): SlotDocumentation {
	const docs: SlotDocumentation = {
		name: "",
		props: [],
	};

	consumeSpace(status);

	// Maybe parse the name
	if (!accept("*", status, false)) {
		docs.name = consumeUntil("\n", status);
		consumeSpace(status);
	}

	while (accept("*", status)) {
		const start = status.i - 1;
		consumeSpace(status);
		if (accept("*", status)) {
			// It was an empty line; move on to the next
			status.i -= 1;
			continue;
		} else if (accept("@sprop", status)) {
			// Process @sprop
			const prop = parseDocsProp(status);
			docs.props.push(prop);
		} else if (accept("/", status) || accept("@", status)) {
			// It's the end of the comments or this slot
			status.i = start;
			break;
		}
	}

	return docs;
}
