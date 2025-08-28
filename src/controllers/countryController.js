const countryService = require('../services/countryService');
const pool = require('../config/db');

exports.fetchCountry = async (req, res) => {
	try {
		await countryService.updateCountries();
		res.status(200).json({ message: 'Countries was succefuly imported to database! ' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Error while importing for Database! ' });
	}
};

exports.getTop10 = async (req, res) => {
	try {
		const [check] = await pool.query('SELECT COUNT(*) AS total FROM paises');
		if (check[0].total === 0) {
			return res.status(400).json({
				error: 'No Country Found, Please, Import the data with GET from /paises/importar',
			});
		}

		const top10 = await countryService.getTop10Country();
		res.json(top10);
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'Sorry, we have issues while searching top10 Countries' });
	}
};

exports.searchCountryByName = async (req, res) => {
	const nome = req.query.nome;

	if (!nome) {
		return res.status(400).json({ erro: 'Parameter nome is required for search' });
	}

	try {
		const [check] = await pool.query('SELECT COUNT(*) AS total FROM paises');
		if (check[0].total === 0) {
			return res.status(400).json({
				erro: 'No Country Found, Please, Import the data with GET from /paises/importar',
			});
		}

		const pais = await countryService.searchCountryByName(nome);

		if (!pais) {
			return res.status(404).json({ erro: `No country named as '${nome}' was found.` });
		}

		res.json(pais);
	} catch (error) {
		console.error(error);
		res.status(500).json({ erro: 'Erro ao buscar país por nome' });
	}
};

exports.sendFeedbackByCountry = async (req, res) => {
	const { nome, avaliacao } = req.body;

	if (!nome || !avaliacao) {
		return res.status(400).json({
			erro: 'Please The values of nome and avaliacao is required',
		});
	}

	if (!['curti', 'nao_curti'].includes(avaliacao)) {
		return res.status(400).json({
			erro: 'the field "avaliacao" values has to be "curti" or "nao_curti".',
		});
	}

	try {
		const [check] = await pool.query('SELECT COUNT(*) AS total FROM paises');
		if (check[0].total === 0) {
			return res.status(400).json({
				erro: 'No Country Found, Please, Import the data with GET from /paises/importar',
			});
		}

		const resultado = await countryService.sendFeedbackByCountry(nome, avaliacao);
		res.json(resultado);
	} catch (error) {
		console.error(error);
		res.status(400).json({
			erro: error.message || 'Sorry, Error by giving an feedback',
		});
	}
};
