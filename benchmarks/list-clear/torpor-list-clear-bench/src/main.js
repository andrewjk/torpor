import { mount, unmount } from '@torpor/view';
import App from './App.torp';
import {
	clearOwned,
	clearSharedLarge,
	clearSharedSmall,
	fillOwned,
	fillSharedLarge,
	fillSharedSmall,
} from './ops.js';

const target = document.getElementById('main');

// index.html does NOT auto-mount; the harness calls __mount() once (untimed).
window.__mount = () => {
	mount(target, App);
};

// Untimed state-reset helpers (harness `pre` steps).
window.__fillSharedSmall = () => fillSharedSmall();
window.__fillSharedLarge = () => fillSharedLarge();
window.__fillOwned = () => fillOwned();

// Timed ops.
window.__opClearSharedSmall = () => clearSharedSmall();
window.__opClearSharedLarge = () => clearSharedLarge();
window.__opClearOwned = () => clearOwned();

window.__ready = true;
