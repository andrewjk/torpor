import Component from "../Component";

export function view(component: Component, props?: any) {
  return component;
}

export function ok(body: string) {
  return "ok";
}

export function json(body: any) {
  return "json";
}
