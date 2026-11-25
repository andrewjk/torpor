import { expect, test } from "vite-plus/test";
import forLoopVarNames from "../../src/compile/utils/forLoopVarNames";

const cases: [statement: string, names: string[]][] = [
	["for (let item of items)", ["item"]],
	["for (const item of items)", ["item"]],
	["for (var item of items)", ["item"]],
	["for (item of items)", ["item"]],
	["for (let key in obj)", ["key"]],
	["for (let i = 0; i < n; i++)", ["i"]],
	["for (let i = 0, j = 1; i < n; i++)", ["i", "j"]],
	["for (i = 0; i < n; i++)", ["i"]],
	["for (let [a, b] of pairs)", ["a", "b"]],
	["for (let [a, , b = 1, ...rest] of pairs)", ["a", "b", "rest"]],
	["for (let { name, age: years = 0 } of rows)", ["name", "years"]],
	["for (let { user: { first, last } } of rows)", ["first", "last"]],
	['for (let { "a,b": value, [key]: computed } of rows)', ["value", "computed"]],
	["for (let [a, { b: [c = 1, d] }] of rows)", ["a", "c", "d"]],
	['for (let { a = "x,y", b } of rows)', ["a", "b"]],
	["for (let i = 0 /* ; */; i < n; i++)", ["i"]],
	["for (let i = 0; i < n /* ; */; i++)", ["i"]],
	["for (let x of arr /* of ; */)", ["x"]],
	['for (let x of ["a;b", "c,d"])', ["x"]],
	["for (let x = { a: 1 }; x; x++)", ["x"]],
	['for (let x = "a;b"; x; )', ["x"]],
	["for (let x of arr.filter((v) => /[;)]/.test(v)))", ["x"]],
];

for (const [statement, expected] of cases) {
	test(statement, () => {
		expect(forLoopVarNames(statement)).toEqual(expected);
	});
}
