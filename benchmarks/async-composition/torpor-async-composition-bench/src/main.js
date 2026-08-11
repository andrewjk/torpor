import { mount } from '@torpor/view';
import App from './App.torp';
import { installBrowserBenchmark } from './browser.js';

const target = document.getElementById('main');

installBrowserBenchmark(target, () => {
	mount(target, App);
});
