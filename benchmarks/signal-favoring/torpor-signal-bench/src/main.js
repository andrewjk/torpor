import { mount, unmount } from '@torpor/view';
import App, {
	bumpAt1,
	bumpAt11,
	bumpAt21,
	bumpAt31,
	bumpAt41,
	bumpAt51,
	bumpAt61,
	bumpAt71,
	bumpAt81,
	bumpAt91,
} from './App.torp';

const target = document.getElementById('main');

// index.html does NOT auto-mount — harness wraps each call in performance.now().
window.__mount = () => {
	mount(target, App, {});
};
window.__unmount = () => {
	unmount(target);
};
window.__reset = () => {
	unmount(target);
	while (target.firstChild) target.removeChild(target.firstChild);
};
window.__bumpAt1 = () => bumpAt1();
window.__bumpAt11 = () => bumpAt11();
window.__bumpAt21 = () => bumpAt21();
window.__bumpAt31 = () => bumpAt31();
window.__bumpAt41 = () => bumpAt41();
window.__bumpAt51 = () => bumpAt51();
window.__bumpAt61 = () => bumpAt61();
window.__bumpAt71 = () => bumpAt71();
window.__bumpAt81 = () => bumpAt81();
window.__bumpAt91 = () => bumpAt91();
window.__sweepBatched = () => {
	bumpAt1();
	bumpAt11();
	bumpAt21();
	bumpAt31();
	bumpAt41();
	bumpAt51();
	bumpAt61();
	bumpAt71();
	bumpAt81();
	bumpAt91();
};
window.__sweepBatchedReverse = () => {
	bumpAt91();
	bumpAt81();
	bumpAt71();
	bumpAt61();
	bumpAt51();
	bumpAt41();
	bumpAt31();
	bumpAt21();
	bumpAt11();
	bumpAt1();
};
window.__ready = true;
