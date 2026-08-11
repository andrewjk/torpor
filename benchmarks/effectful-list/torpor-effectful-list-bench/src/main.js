import { mount, unmount } from '@torpor/view';
import App from './App.torp';
import { toEmpty, toFresh1k, updateNodeps, updateDeps, remove100 } from './ops.js';
import './fx.js';

const target = document.getElementById('main');

// index.html does NOT auto-mount; the harness calls __mount() once (untimed).
window.__mount = () => {
	mount(target, App);
};

// Untimed state-reset helpers (harness `pre` steps).
window.__toEmpty = () => toEmpty();
window.__toFresh1k = () => toFresh1k();

// Timed ops.
window.__opMount1k = () => toFresh1k();
window.__opUpdateNodeps = () => updateNodeps();
window.__opUpdateDeps = () => updateDeps();
window.__opClear = () => toEmpty();
window.__opRemount = () => toFresh1k();
window.__opRemove100 = () => remove100();

window.__ready = true;
