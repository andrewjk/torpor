import AppBase from "./AppBase";

// TODO: Have to pass this into entryClient and entryServer somehow
export default class App extends AppBase {
	constructor() {
		super();
		this.addPage("/", import("./routes/counter.ts"));
		this.addPage("/about", import("./routes/about.ts"));
	}
}
