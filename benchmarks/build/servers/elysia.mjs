import { node } from '@elysia/node';
import { Elysia } from 'elysia';

const app = new Elysia({ adapter: node() });
app
	.get('/', () => 'Hi')
	.get('/id/:id', ({ params, query, set }) => {
		set.headers['x-powered-by'] = 'benchmark';
		return `${params.id} ${query.name}`;
	})
	.get('/user', () => ({ id: 123, name: 'Alice', roles: ['admin', 'editor'] }))
	.post('/json', ({ body }) => body);

const port = parseInt(process.env.PORT || '7105');
app.listen(port);
console.log(`elysia listening on ${port}`);
