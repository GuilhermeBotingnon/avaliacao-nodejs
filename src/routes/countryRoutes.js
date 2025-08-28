const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

router.get('/paises/importar', countryController.fetchCountry);
router.get('/paises/top10', countryController.getTop10);
router.get('/paises/buscar', countryController.searchCountryByName);
router.post('/paises/avaliar', countryController.sendFeedbackByCountry);

module.exports = router;
