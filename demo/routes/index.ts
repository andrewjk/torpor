import Index from "../client/Components/Home/Index.tera";
import { view } from "../site/server/response";

function load() {}

function render() {
  return view(Index);
}

function post() {}

function submit() {}

function del() {}

export function GET() {
  return view(Index);
}

// layout option, path option etc for overriding?
export const route = { load, render, actions: { post, submit, del } };
