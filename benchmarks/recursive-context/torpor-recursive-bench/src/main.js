import { mount, unmount } from '@torpor/view';
import App, { bumpRoot, bumpPartial, hideMid, showMid } from './App.torp';

const target = document.getElementById('main');

// index.html does NOT auto-mount; the harness wraps each call in performance.now().
window.__mount = () => {
	mount(target, App, { depth: 10 });
};
window.__updateRoot = () => bumpRoot();
window.__updatePartial = () => bumpPartial();
window.__partialUnmount = () => hideMid();
window.__partialRemount = () => showMid();
window.__unmount = () => {
	unmount(target);
};
window.__reset = () => {
	unmount(target);
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__ready = true;
