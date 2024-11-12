import type { Component } from "@tera/view";
import type PageParams from "./PageParams";

export default interface EndPoint {
	route?: (...args: any[]) => string;
	load?: (params: PageParams) => any;
	component?: Component;
	// TODO: Better typing
	head?: HeadElement[] | ((params: PageParams) => HeadElement[]);
}

type HeadElement = TitleElement | MetaElement;

interface TitleElement {
	title: string;
}

interface MetaElement {
	name: string;
	content: string;
}
