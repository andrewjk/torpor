const fastify = require('fastify')({ logger: false });

fastify.get('/', async () => 'Hi');
fastify.get('/id/:id', async (req, rep) => {
	rep.header('x-powered-by', 'benchmark');
	return `${req.params.id} ${req.query.name}`;
});
fastify.get('/user', async () => ({ id: 123, name: 'Alice', roles: ['admin', 'editor'] }));
fastify.post('/json', async (req) => req.body);

const port = parseInt(process.env.PORT || '7104');
fastify.listen({ port, host: process.env.HOST || '127.0.0.1' }, (err) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`fastify listening on ${port}`);
});
