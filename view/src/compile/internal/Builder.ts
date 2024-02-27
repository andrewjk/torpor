export default class Builder {
  result = "";
  space = 0;

  append(text: string) {
    this.result += " ".repeat(this.space * 2);
    this.result += text;
    this.result += "\n";
  }

  gap() {
    this.result += "\n";
  }

  indent() {
    this.space += 1;
  }

  outdent() {
    this.space -= 1;
  }
}
