//import typescriptLogo from './typescript.svg'
//import viteLogo from '/vite.svg'
//import { setupCounter } from './counter.ts'
import render from "../view/src/render/render";
import "./assets/style.css";
import Index from "./client/Components/Home/Demo.tera";
import { app, router } from "./site/globals";

const modules = import.meta.glob("./routes/*.ts");
for (let route in modules) {
  //route = route.substring("./routes/".length);
  //router.add(route.split("/").slice(2));
  //router.add("get", route.substring("./routes/".length));
  const code = await modules[route]();
  route = route
    .substring("./routes/".length)
    .replace(/index.ts$/, "")
    .replace(/.ts$/, "");
  if (code.GET) {
    console.log("adding router GET", route, String(code.GET));
    router.add("GET", route, code.GET);
  }
}
//console.log()

//const root = document.getElementById("tera-main");
//if (root) {
//  render(root, Index);
//}

const root = document.getElementById("tera-main");
if (root) {
  //render(root, Index);
  router.node = root;
  router.handleNavigation();
}

window.addEventListener("click", (e) => {
  //console.log("hi", e.target);
  if (e.target && (e.target as HTMLElement).tagName === "A") {
    // TODO: intercept the click
    //e.preventDefault();
  }
});
