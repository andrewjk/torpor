import { ParamsType } from "./ParamsType";

export default interface EndPointRequest<RP extends ParamsType, UP extends ParamsType> {
	routeParams?: RP;
	urlParams?: UP;
}
