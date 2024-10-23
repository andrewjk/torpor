export default class Builder {
	#text = "";
	#space = 0;

	prepend(text: string) {
		this.#text = text + "\n" + this.#text;
	}

	append(text: string) {
		text = text.trim();
		let i = 0;
		let newline = !!text.length && !text.endsWith("\n");

		while (i < text.length) {
			// Skip spaces
			while (text[i] === " " || text[i] === "\t") {
				i++;
			}
			if (text[i] === ";") {
				// HACK: we just set ; to ignore the line
				i++;
			} else if (text[i] === "\n") {
				this.#text += "\n";
			} else {
				// Maybe outdent
				if (text[i] === "}" || text[i] === ")" || text[i] === "]") {
					this.#space -= 1;
				}

				// Add indentation
				this.#text += "\t".repeat(Math.max(0, this.#space));

				// Add from text until the next newline or the end of text
				const start = i;
				while (i < text.length && text[i] !== "\n") {
					i++;
				}
				const line = text.substring(start, i + 1);
				if (line.startsWith("*")) {
					// JSDoc
					this.#text += " ";
				}
				this.#text += line;

				// Maybe indent
				if (text[i - 1] === "{" || text[i - 1] === "(" || text[i - 1] === "[") {
					this.#space += 1;
				}
			}
			i++;
		}

		if (!this.#text.endsWith("\n\n")) {
			this.#text += "\n";
		}
	}

	toString() {
		return this.#text;
	}
}
