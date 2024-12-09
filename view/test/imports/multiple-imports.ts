import { beforeAll, expect, test } from "vitest";
import parse from "../../src/compile/parse";
import type ParseResult from "../../src/compile/types/ParseResult";
import { trimParsed } from "../helpers";

test("multiple imports", () => {
	const input = `
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
import defaultExport from "module-name";
import * as name from "module-name";
import { export1 } from "module-name";
import { export2 as alias1 } from "module-name";
import { xdefault as alias2 } from "module-name";
import { export3, export4 } from "module-name";
import { export5, export6 as alias3 } from "module-name";
//import { "string name" as alias4 } from "module-name";
import defaultExport2, { export7, export8 } from "module-name";
import { export9, export10 }, defaultExport3 from "module-name";
import defaultExport4, * as name2 from "module-name";
//import "module-name";
import {
	export11,
	export12
} from "module-name";
`;
	const output = trimParsed(parse(input));
	const expected: ParseResult = {
		ok: true,
		errors: [],
		template: {
			imports: [
				//import defaultExport from "module-name";
				{
					name: "defaultExport",
					alias: undefined,
					path: "module-name",
					nonDefault: false,
					component: false,
				},
				//import * as name from "module-name";
				{
					name: "*",
					alias: "name",
					path: "module-name",
					nonDefault: false,
					component: false,
				},
				//import { export1 } from "module-name";
				{
					name: "export1",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				//import { export2 as alias1 } from "module-name";
				{
					name: "export2",
					alias: "alias1",
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				//import { xdefault as alias2 } from "module-name";
				{
					name: "xdefault",
					alias: "alias2",
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				//import { export3, export4 } from "module-name";
				{
					name: "export3",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				{
					name: "export4",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				//import { export5, export6 as alias3 } from "module-name";
				{
					name: "export5",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				{
					name: "export6",
					alias: "alias3",
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				//import defaultExport2, { export7, export 8 } from "module-name";
				{
					name: "defaultExport2",
					alias: undefined,
					path: "module-name",
					nonDefault: false,
					component: false,
				},
				{
					name: "export7",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				{
					name: "export8",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				//import { export9, export10 }, defaultExport3 from "module-name";
				{
					name: "export9",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				{
					name: "export10",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				{
					name: "defaultExport3",
					alias: undefined,
					path: "module-name",
					nonDefault: false,
					component: false,
				},
				//import defaultExport4, * as name2 from "module-name";
				{
					name: "defaultExport4",
					alias: undefined,
					path: "module-name",
					nonDefault: false,
					component: false,
				},
				{
					name: "*",
					alias: "name2",
					path: "module-name",
					nonDefault: false,
					component: false,
				},
				//import { export11, export12 } from "module-name";
				{
					name: "export11",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
				{
					name: "export12",
					alias: undefined,
					path: "module-name",
					nonDefault: true,
					component: false,
				},
			],
			script: input,
			components: [],
		},
	};
	expect(output).toEqual(expected);
});
