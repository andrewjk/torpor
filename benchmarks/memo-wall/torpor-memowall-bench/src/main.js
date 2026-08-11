import { mount, unmount } from '@torpor/view';
import App from './App.torp';
import { parentRerenderA, parentRerenderB, oneChangeA, oneChangeB, ctxA, ctxB, currentState } from './ops.js';
import './probes.js';

const target = document.getElementById('main');

// index.html does NOT auto-mount — harness calls __mount() once (untimed).
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

// Timed ops.
window.__tickA = () => parentRerenderA();
window.__tickB = () => parentRerenderB();
window.__oneChangeA = () => oneChangeA();
window.__oneChangeB = () => oneChangeB();
window.__ctxA = () => ctxA();
window.__ctxB = () => ctxB();
window.__state = () => currentState();

window.__ready = true;
