const express = require('express');
const countryRoutes = require('./routes/countryRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', countryRoutes);

app.get('/health', (req, res) =>
	res.json({
		ok: true,
		timestamp: new Date().toISOString(),
	})
);

app.use((req, res, next) => {
	res.status(404).json({
		erro: 'Rota não encontrada',
	});
});

module.exports = app;
