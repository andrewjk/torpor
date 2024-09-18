import type Component from "./Component";
import type EndPointRequest from "./EndPointRequest";
import type ParamsType from "./ParamsType";

export default interface EndPoint<RP extends ParamsType = {}, UP extends ParamsType = {}> {
	route?: (...args: any[]) => string;
	data?: (request: EndPointRequest<RP, UP>) => any;
	view?: (request: EndPointRequest<RP, UP>) => { component: Component; data?: any };
}
