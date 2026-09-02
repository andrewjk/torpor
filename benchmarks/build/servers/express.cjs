const express = require('express');

const app = express();
app.set('x-powered-by', false);
app.set('etag', false);

app.get('/', (_req, res) => {
	res.type('text/plain').send('Hi');
});
app.get('/id/:id', (req, res) => {
	res.set('x-powered-by', 'benchmark').type('text/plain').send(`${req.params.id} ${req.query.name}`);
});
app.get('/user', (_req, res) => {
	res.json({ id: 123, name: 'Alice', roles: ['admin', 'editor'] });
});
app.post('/json', express.json(), (req, res) => {
	res.json(req.body);
});

const port = parseInt(process.env.PORT || '7102');
app.listen(port, process.env.HOST || '127.0.0.1', () => {
	console.log(`express listening on ${port}`);
});
