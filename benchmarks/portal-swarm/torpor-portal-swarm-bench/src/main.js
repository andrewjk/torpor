import { mount, unmount } from '@torpor/view';
import App from './App.torp';
import {
	openA,
	closeA,
	openB,
	closeB,
	openBS,
	closeBS,
	openAll,
	closeAll,
	rerenderA,
	rerenderB,
	rerenderBS,
	setDistinct,
} from './ops.js';

const target = document.getElementById('main');
window.__hits = 0;

// index.html does NOT auto-mount; the harness wraps each call in performance.now().
window.__mount = () => {
	mount(target, App);
};
window.__unmount = () => {
	unmount(target);
};
window.__reset = () => {
	unmount(target);
	while (target.firstChild) target.removeChild(target.firstChild);
};

// Ops.
window.__openA = () => openA();
window.__closeA = () => closeA();
window.__openB = () => openB();
window.__closeB = () => closeB();
window.__openBS = () => openBS();
window.__closeBS = () => closeBS();
window.__openAll = () => openAll();
window.__closeAll = () => closeAll();
window.__rerenderA = () => rerenderA();
window.__rerenderB = () => rerenderB();
window.__rerenderBS = () => rerenderBS();
window.__setDistinct = (on) => setDistinct(on);

window.__ready = true;
