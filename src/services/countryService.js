const axios = require('axios');
const pool = require('../config/db');

const fetchAndStorageCountries = async () => {
	try {
		const allCountriesNameUrl = 'https://restcountries.com/v3.1/all?fields=name';

		const response = await axios.get(allCountriesNameUrl);
		const countriesNames = response.data.map((c) => c.name.common);

		const countriesData = await Promise.allSettled(
			countriesNames.map(async (countryName) => {
				try {
					const res = await axios.get(
						`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`
					);
					const country = res.data[0];

					return {
						name: country.name.common,
						region: country.region,
						population: country.population,
						language: Object.values(country.languages)[0],
						flag: country.flags.png,
					};
				} catch (error) {
					return null;
				}
			})
		);

		const validCountries = countriesData
			.filter((result) => result.status === 'fulfilled' && result.value)
			.map((result) => result.value);

		return validCountries;
	} catch (error) {
		throw error;
	}
};

const insertCountries = async (countries) => {
	try {
		if (!countries.length) return;

		const values = countries.map((c) => [c.name, c.population, c.region, c.flag, c.language]);

		const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');

		const query = `
        INSERT IGNORE INTO paises (nome, populacao, regiao, bandeira, lingua) VALUES ${placeholders};`;

		const flattenedValues = values.flat();

		const [result] = await pool.query(query, flattenedValues);
		console.log(`A total of ${result.affectedRows} Countries was succefuly imported in database`);
		return result;
	} catch (error) {
		console.error('Error while importing contries', error);
		throw error;
	}
};

async function updateCountries() {
	try {
		const countries = await fetchAndStorageCountries();
		await insertCountries(countries);
		console.log('Database was updated');
	} catch (error) {
		console.error('Error while trying updating the database: ', error);
	}
}

async function getTop10Country() {
	const [rows] = await pool.query(`
    SELECT
    p.nome, p.populacao, p.regiao, p.bandeira, p.lingua,
    IFNULL(a.curtidas, 0) AS curtidas,
    IFNULL(a.nao_curtidas, 0) AS nao_curtidas
    FROM paises p
    LEFT JOIN avaliacoes a ON p.id = a.pais_id
    ORDER BY p.populacao DESC
    LIMIT 10
  `);

	return rows;
}

async function searchCountryByName(nome) {
	const [rows] = await pool.query(
		`
        SELECT
        p.nome, p.populacao, p.regiao, p.bandeira, p.lingua,
        IFNULL(a.curtidas, 0) AS curtidas,
        IFNULL(a.nao_curtidas, 0) AS nao_curtidas
        FROM paises p
        LEFT JOIN avaliacoes a ON p.id = a.pais_id
        WHERE p.nome LIKE CONCAT('%', ?, '%')
        LIMIT 1
    `,
		[nome]
	);

	return rows[0];
}

async function sendFeedbackByCountry(nome, avaliacao) {
	const [paisRows] = await pool.query(`SELECT id FROM paises WHERE nome = ? LIMIT 1`, [nome]);

	if (paisRows.length === 0) {
		throw new Error(`Country "${nome}" Not Found.`);
	}

	const paisId = paisRows[0].id;

	const [avaliacaoRows] = await pool.query(`SELECT * FROM avaliacoes WHERE pais_id = ?`, [paisId]);

	if (avaliacaoRows.length === 0) {
		await pool.query(
			`INSERT INTO avaliacoes (pais_id, curtidas, nao_curtidas)
            VALUES (?, ?, ?)`,
			[paisId, avaliacao === 'curti' ? 1 : 0, avaliacao === 'nao_curti' ? 1 : 0]
		);
	} else {
		await pool.query(
			`UPDATE avaliacoes
            SET ${avaliacao === 'curti' ? 'curtidas = curtidas + 1' : 'nao_curtidas = nao_curtidas + 1'},
            updated_at = CURRENT_TIMESTAMP
            WHERE pais_id = ?`,
			[paisId]
		);
	}

	const [[result]] = await pool.query(
		`SELECT
        p.nome,
        IFNULL(a.curtidas, 0) AS curtidas,
        IFNULL(a.nao_curtidas, 0) AS nao_curtidas
        FROM paises p
        LEFT JOIN avaliacoes a ON p.id = a.pais_id
        WHERE p.id = ?`,
		[paisId]
	);

	return {
		pais: result.nome,
		avaliacao,
		status: 'success',
		curtidas: result.curtidas,
		nao_curtidas: result.nao_curtidas,
		mensagem: 'Feedback Sent Succefully',
	};
}

module.exports = {
	fetchAndStorageCountries,
	insertCountries,
	updateCountries,
	getTop10Country,
	searchCountryByName,
	sendFeedbackByCountry,
};
