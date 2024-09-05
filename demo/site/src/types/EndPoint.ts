import Component from "./Component";
import EndPointRequest from "./EndPointRequest";
import { ParamsType } from "./ParamsType";

export default interface EndPoint<RP extends ParamsType = {}, UP extends ParamsType = {}> {
	route?: (...args: any[]) => string;
	data?: (request: EndPointRequest<RP, UP>) => any;
	view?: (request: EndPointRequest<RP, UP>) => { component: Component; data?: any };
}
