export default class Builder {
	#text = "";
	#space = 0;

	append(text: string) {
		let i = text.startsWith("\n") ? 1 : 0;
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
				this.#text += text.substring(start, i + 1);

				// Maybe indent
				if (text[i - 1] === "{" || text[i - 1] === "(" || text[i - 1] === "[") {
					this.#space += 1;
				}
			}
			i++;
		}
		this.#text += "\n";
	}

	toString() {
		return this.#text;
	}
}
