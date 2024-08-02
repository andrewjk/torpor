import Route from "./Route";

export default interface Options {
  routes: Route[];
  root: string;
  componentNames: string[];
  layoutName: string;
  componentName: string;
}
