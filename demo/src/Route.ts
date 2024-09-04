import Component from "../site/Component";

export default interface Route {
	data?: () => any;
	view?: () => Component;
}
