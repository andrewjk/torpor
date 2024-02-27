export default class Builder {
  #text = "";
  #space = 0;

  append(text: string) {
    this.#text += " ".repeat(this.#space * 2);
    this.#text += text;
    this.#text += "\n";
  }

  gap() {
    this.#text += "\n";
  }

  indent() {
    this.#space += 1;
  }

  outdent() {
    this.#space -= 1;
  }

  toString() {
    return this.#text;
  }
}
