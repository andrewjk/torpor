//import typescriptLogo from './typescript.svg'
//import viteLogo from '/vite.svg'
//import { setupCounter } from './counter.ts'
import mount from "../../view/src/render/mount";
import Index from "./Index.tera";
import "./style.css";

const root = document.getElementById("tera-container");
if (root) {
	mount(root, Index);
}
