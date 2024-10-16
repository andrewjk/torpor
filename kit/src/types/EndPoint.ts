import type { Component } from "@tera/view";
import type EndPointRequest from "./EndPointRequest";
import type PageParams from "./PageParams";
import type ParamsType from "./ParamsType";

export default interface EndPoint<RP extends ParamsType = {}, UP extends ParamsType = {}> {
	route?: (...args: any[]) => string;
	load?: (params: PageParams) => any;
	// TODO: Remove this, it's obsolete:
	view?: (request: EndPointRequest<RP, UP>) => { component: Component; data?: any };
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
