import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();
app
	.get('/', (c) => c.text('Hi'))
	.get('/id/:id', (c) => {
		const id = c.req.param('id');
		const name = c.req.query('name');
		c.header('x-powered-by', 'benchmark');
		return c.text(`${id} ${name}`);
	})
	.get('/user', (c) => c.json({ id: 123, name: 'Alice', roles: ['admin', 'editor'] }))
	.post('/json', (c) => c.req.json().then((b) => c.json(b)));

const port = parseInt(process.env.PORT || '7103');
serve({ fetch: app.fetch, port, hostname: process.env.HOST || '127.0.0.1' }, (info) => {
	console.log(`hono listening on ${info.port}`);
});
