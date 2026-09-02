import { createApp, nextTick } from 'vue';
import App from './App.vue';

createApp(App).mount('#main');

// Vue commits on a microtask (queueJob → flushJobs) and exposes no public
// synchronous flush. The harness detects this hook and extends each timed
// click window until the returned promise resolves — nextTick() settles after
// the DOM mutation for the click has landed. The extra microtask hop is Vue's
// own scheduling cost, so it belongs inside the measurement.
window.__benchFlush = () => nextTick();
