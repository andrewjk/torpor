import { mount, unmount } from '@torpor/view';
import App from './App.torp';
import { tickFull, tickPartial, remount, sortRows } from './ops.js';

const target = document.getElementById('main');

// index.html does NOT auto-mount; the harness wraps each call in performance.now().
window.__mount = () => {
	mount(target, App);
};
window.__tick = () => tickFull();
window.__tickPartial = () => tickPartial();
window.__remount = () => remount();
window.__sort = () => sortRows();
window.__unmount = () => {
	unmount(target);
};
window.__reset = () => {
	unmount(target);
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__ready = true;
