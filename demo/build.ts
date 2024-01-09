import fs from "fs";
import path from "path";
import build from "../view/src/compile/build";
import parse from "../view/src/compile/parse";

const source = fs.readFileSync("./src/Demo.tera", "utf8");
const parsed = parse(source);
if (parsed.ok && parsed.syntaxTree) {
  const output = build("Demo", parsed.syntaxTree);
  //if (!fs.existsSync("./dist")) {
  //  fs.mkdirSync("./dist");
  //}
  fs.writeFileSync("./src/Demo.ts", output);
} else {
  console.log("\nERRORS\n======");
  //console.log(parsed.errors);
  for (let error of parsed.errors) {
    //const line = (input.slice(0, error.i).match(/\n/g) || "").length + 1;
    let slice = source.slice(0, error.start);
    let line = 1;
    let last_line_index = 0;
    for (let i = 0; i < slice.length; i++) {
      if (source[i] === "\n") {
        line += 1;
        last_line_index = i;
      }
    }
    console.log(`${line},${error.start - last_line_index - 1}: ${error.message}`);
    console.log("======\n");
  }
}
